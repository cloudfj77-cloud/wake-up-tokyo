#include <AK/SoundEngine/Common/AkMemoryMgr.h>
#include <AK/SoundEngine/Common/AkMemoryMgrModule.h>
#include <AK/SoundEngine/Common/AkSoundEngine.h>
#include <AK/SoundEngine/Common/AkStreamMgrModule.h>
#include <AK/SoundEngine/Common/AkQueryParameters.h>
#include <AK/SoundEngine/Common/IAkStreamMgr.h>
#include <AK/Plugin/AkVorbisDecoderFactory.h>
#include <cstdint>
#include <cstdlib>
#include <string>
#include <unordered_map>
#include <deque>
#include <cstring>
#include <algorithm>

// Single-threaded Emscripten: PerformIO schedules bounded asynchronous HTTP reads.
// JS polls requests without blocking the audio render and completes each callback once.
namespace {
class WebIO final : public AK::StreamMgr::IAkLowLevelIOHook, public AK::StreamMgr::IAkFileLocationResolver {
 public:
  AkDeviceID device = AK_INVALID_DEVICE_ID;
  std::unordered_map<uint32_t,uint32_t> files;
  struct Read { AkAsyncIOTransferInfo* transfer; uint32_t file; };
  std::unordered_map<uint32_t,Read> pending;
  std::deque<uint32_t> queue;
  uint32_t sequence=0,open=0,bytes=0,reads=0,peak=0;
  AKRESULT Init(){AkDeviceSettings settings;AK::StreamMgr::GetDefaultDeviceSettings(settings);settings.uIOMemorySize=2*1024*1024;settings.uGranularity=32768;settings.fTargetAutoStmBufferLength=2000;settings.uMaxConcurrentIO=8;settings.bUseStreamCache=true;settings.uMaxCachePinnedBytes=0;AK::StreamMgr::SetFileLocationResolver(this);return AK::StreamMgr::CreateDevice(settings,this,device);}
  void BatchOpen(AkUInt32 count,AkAsyncFileOpenData** items) override {
   for(AkUInt32 i=0;i<count;++i){auto* item=items[i];uint32_t id=item->fileID;
    if(item->pszFileName){const char* name=item->pszFileName;const char* slash=strrchr(name,'/');id=std::strtoul(slash?slash+1:name,nullptr,10);}
    auto f=files.find(id);if(item->eOpenMode!=AK_OpenModeRead||f==files.end()){item->pCallback(item,AK_FileNotFound);continue;}
    item->pFileDesc=new AkFileDesc();item->pFileDesc->iFileSize=f->second;item->pFileDesc->deviceID=device;item->pFileDesc->hFile=reinterpret_cast<AkFileHandle>(uintptr_t(id));++open;item->pCallback(item,AK_Success);
   }
  }
  AKRESULT Close(AkFileDesc* file) override {delete file;if(open)--open;return AK_Success;}
  AkUInt32 GetBlockSize(AkFileDesc&) override {return 1;}
  void GetDeviceDesc(AkDeviceDesc&) override {}
  AkUInt32 GetDeviceData() override {return open;}
  void BatchRead(AkUInt32 count,BatchIoTransferItem* items) override {
   for(AkUInt32 i=0;i<count;++i){auto& item=items[i];auto* t=item.pTransferInfo;
    if(t->uFilePosition>UINT32_MAX){t->pCallback(t,AK_Fail);continue;}
    const uint32_t token=++sequence;pending.emplace(token,Read{t,uint32_t(reinterpret_cast<uintptr_t>(item.pFileDesc->hFile))});queue.push_back(token);peak=std::max(peak,uint32_t(pending.size()));
   }
  }
  void BatchWrite(AkUInt32 count,BatchIoTransferItem* items) override {for(AkUInt32 i=0;i<count;++i)items[i].pTransferInfo->pCallback(items[i].pTransferInfo,AK_Fail);}
  int Next(uint32_t* out){while(!queue.empty()){uint32_t token=queue.front();queue.pop_front();auto p=pending.find(token);if(p==pending.end())continue;auto* t=p->second.transfer;out[0]=token;out[1]=p->second.file;out[2]=uint32_t(t->uFilePosition);out[3]=t->uRequestedSize;out[4]=uint32_t(reinterpret_cast<uintptr_t>(t->pBuffer));return 1;}return 0;}
  void Complete(uint32_t token,bool success){auto it=pending.find(token);if(it==pending.end())return;auto* t=it->second.transfer;pending.erase(it);if(success){bytes+=t->uRequestedSize;++reads;}t->pCallback(t,success?AK_Success:AK_Fail);}
  void Abort(){queue.clear();while(!pending.empty())Complete(pending.begin()->first,false);}
  void Term(){Abort();if(device!=AK_INVALID_DEVICE_ID){AK::StreamMgr::DestroyDevice(device);device=AK_INVALID_DEVICE_ID;}AK::StreamMgr::SetFileLocationResolver(nullptr);files.clear();open=bytes=reads=peak=0;}
} webIO;
}
namespace {
constexpr AkGameObjectID listener = 0xffffffffULL;
std::string workletUrl;
uint32_t starvationCount=0;
void eventCallback(AkCallbackType type,AkEventCallbackInfo*,void*,void*){if(type==AK_Starvation)++starvationCount;}
void terminate() {
  webIO.Abort();
  if (AK::SoundEngine::IsInitialized()) AK::SoundEngine::Term();
  if (AK::IAkStreamMgr::Get()) webIO.Term();
  if (AK::IAkStreamMgr::Get()) AK::IAkStreamMgr::Get()->Destroy();
  if (AK::MemoryMgr::IsInitialized()) AK::MemoryMgr::Term();
}
}
extern "C" {
int fw_init(const char* url) {
  if (AK::SoundEngine::IsInitialized()) return AK_Fail;
  AkMemSettings memory; AK::MemoryMgr::GetDefaultSettings(memory);
  auto r = AK::MemoryMgr::Init(&memory);
  if (r != AK_Success) { terminate(); return r; }
  AkStreamMgrSettings stream; AK::StreamMgr::GetDefaultSettings(stream);
  if (!AK::StreamMgr::Create(stream)) { terminate(); return AK_Fail; }
  r=webIO.Init();if(r!=AK_Success){terminate();return r;}
  AkInitSettings init; AkPlatformInitSettings platform;
  AK::SoundEngine::GetDefaultInitSettings(init);
  AK::SoundEngine::GetDefaultPlatformInitSettings(platform);
  init.bUseLEngineThread = false;
  workletUrl = url; platform.szAudioWorkletProcessorUrl = workletUrl.c_str();
  r = AK::SoundEngine::Init(&init, &platform);
  if (r == AK_Success) r = AK::SoundEngine::RegisterGameObj(listener, "Listener");
  if (r == AK_Success) r = AK::SoundEngine::SetDefaultListeners(&listener, 1);
  if (r != AK_Success) terminate();
  return r;
}
int fw_register(uint32_t id, const char* name) { return AK::SoundEngine::RegisterGameObj(id, name); }
int fw_unregister(uint32_t id) { return AK::SoundEngine::UnregisterGameObj(id); }
uint32_t fw_post(const char* event, uint32_t id) { return AK::SoundEngine::PostEvent(event, id,AK_Starvation,eventCallback); }
int fw_playing(uint32_t playing){return AK::SoundEngine::Query::GetEventIDFromPlayingID(playing)!=AK_INVALID_UNIQUE_ID;}
int fw_play_position(uint32_t playing){AkTimeMs position=0;return AK::SoundEngine::GetSourcePlayPosition(playing,&position,false)==AK_Success?position:-1;}
uint32_t fw_starvations(){return starvationCount;}
void fw_stop(uint32_t playing, int ms) { AK::SoundEngine::StopPlayingID(playing, ms); }
int fw_rtpc(const char* name, float value, uint32_t id, int global, int ms) {
  return AK::SoundEngine::SetRTPCValue(name, value, global ? AK_INVALID_GAME_OBJECT : id, ms);
}
int fw_switch(const char* group, const char* value, uint32_t id) { return AK::SoundEngine::SetSwitch(group, value, id); }
int fw_state(const char* group, const char* value) { return AK::SoundEngine::SetState(group, value); }
int fw_position(uint32_t id, float x, float y, float z, float fx, float fy, float fz, float ux, float uy, float uz) {
  AkSoundPosition p; p.Set(x,y,z,fx,fy,fz,ux,uy,uz);
  return AK::SoundEngine::SetPosition(id, p);
}
void* fw_alloc(uint32_t size) {
  constexpr size_t a = AK_BANK_PLATFORM_DATA_ALIGNMENT;
  return size ? std::aligned_alloc(a, (size_t(size) + a - 1) & ~(a - 1)) : nullptr;
}
void fw_free(void* p) { std::free(p); }
int fw_load(const void* p, uint32_t size, uint32_t* id) { return AK::SoundEngine::LoadBankMemoryView(p,size,*id); }
int fw_unload(uint32_t id, const void* p) { return AK::SoundEngine::UnloadBank(id,p); }
int fw_render() { AK::StreamMgr::PerformIO();auto result=AK::SoundEngine::RenderAudio();AK::StreamMgr::PerformIO();return result; }
int fw_io_register(uint32_t id,uint32_t size){if(!id||!size)return AK_InvalidParameter;webIO.files[id]=size;return AK_Success;}
int fw_io_next(uint32_t* out){return webIO.Next(out);}
void fw_io_complete(uint32_t token,int success){webIO.Complete(token,success!=0);}
void fw_io_abort(){webIO.Abort();}
uint32_t fw_io_stat(int kind){switch(kind){case 0:return webIO.pending.size();case 1:return webIO.open;case 2:return webIO.bytes;case 3:return webIO.reads;case 4:return webIO.peak;default:return 0;}}
void fw_term() { terminate(); }
}
