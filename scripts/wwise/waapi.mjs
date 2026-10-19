// 撤销组属于 WAAPI 会话，整个制作批次复用同一连接。
export async function connect() {
  const socket = new WebSocket('ws://127.0.0.1:8080/waapi', ['wamp.2.json']);
  let request = 0;
  const pending = new Map();
  let welcome;
  const ready = new Promise((resolve, reject) => {
    welcome = resolve;
    socket.onerror = () => reject(new Error('Cannot connect to local Wwise WAAPI'));
  });
  socket.onopen = () => socket.send(JSON.stringify([1, 'realm1', { roles: { caller: {} } }]));
  socket.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg[0] === 2) return welcome();
    if (msg[0] === 50) {
      const p = pending.get(msg[1]);
      pending.delete(msg[1]);
      p?.resolve(msg[4] ?? {});
    } else if (msg[0] === 8) {
      const p = pending.get(msg[2]);
      pending.delete(msg[2]);
      p?.reject(new Error(JSON.stringify(msg)));
    }
  };
  let timeout;const expired=new Promise((_,reject)=>{timeout=setTimeout(()=>{socket.close();reject(new Error('无法连接本机 Wwise，请先启用 WAAPI'));},10000);});
  socket.onclose=()=>{for(const p of pending.values())p.reject(new Error('Wwise 连接已关闭'));pending.clear();};
  await Promise.race([ready,expired]);clearTimeout(timeout);
  return {
    call(uri, args = {}, options = {}) {
      const id = ++request;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`Timed out: ${uri}`));
        }, 45000);
        pending.set(id, {
          resolve(value) { clearTimeout(timer); resolve(value); },
          reject(error) { clearTimeout(timer); reject(error); },
        });
        socket.send(JSON.stringify([48, id, options, uri, [], args]));
      });
    },
    close() { socket.close(); },
  };
}
