import com.zhixuan.wakeupworker.AssetServer;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;

/** Standalone contract check: run with -ea and the SDK android.jar on the classpath. */
public final class AssetServerCheck {
    public static void main(String[] args) throws Exception {
        AssetServer server = new AssetServer(null, 0);
        server.start();
        try {
            Field field = AssetServer.class.getDeclaredField("socket");
            field.setAccessible(true);
            ServerSocket socket = (ServerSocket) field.get(server);
            assert socket.isBound() && socket.getInetAddress().isLoopbackAddress();
            try {
                new AssetServer(null, socket.getLocalPort()).start();
                throw new AssertionError("a busy port must report startup failure");
            } catch (IOException expected) { }
            Method write = AssetServer.class.getDeclaredMethod("write", java.io.OutputStream.class,
                int.class, String.class, long.class, long.class, long.class, boolean.class, java.io.InputStream.class);
            write.setAccessible(true);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            write.invoke(server, out, 206, "/sound.wem", 10L, 2L, 5L, true,
                new ByteArrayInputStream("23456789".getBytes(StandardCharsets.UTF_8)));
            String response = out.toString(StandardCharsets.UTF_8);
            assert response.startsWith("HTTP/1.1 206 Partial Content\r\n");
            assert response.contains("Content-Range: bytes 2-5/10\r\n");
            assert response.contains("Content-Length: 4\r\n");
            assert response.contains("Cross-Origin-Embedder-Policy: require-corp\r\n");
            assert response.contains("Document-Isolation-Policy: isolate-and-require-corp\r\n");
            assert response.endsWith("\r\n\r\n2345");
            out.reset();
            write.invoke(server, out, 200, "/intro.mp4", 3L, 0L, -1L, false,
                new ByteArrayInputStream(new byte[]{1, 2, 3}));
            assert out.toString(StandardCharsets.ISO_8859_1).contains("Content-Type: video/mp4\r\n");
        } finally {
            server.stop();
        }
        System.out.println("AssetServer: loopback, synchronous startup, range bytes, isolation headers and intro MIME passed");
    }
}
