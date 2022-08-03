from http.server import BaseHTTPRequestHandler, HTTPServer
import urlparse
from typing import Tuple
from pyproj import CRS, Transformer

host_name = '0.0.0.0'
server_port = 7765

def transform_coordinates(x, y) -> Tuple[float, float]:
    pyproj_transformer = Transformer.from_proj(
        CRS.from_epsg(4326),
        CRS.from_proj4('+proj=ortho +lat_0=30 +lon_0=-80 +x_0=0 +y_0=0')
    )
    return pyproj_transformer.transform(
        x,
        y
    )

class ProjVisServer(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse.urlparse(self.path)
        parsed_query = urlparse.parse_qs(o.query)

        # proj
        # min_lon
        # min_lat
        # max_lon
        # max_lat
        # step
        # offset
        # limit

        result = transform_coordinates(0, 0)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(bytes('{data: [%f, %f]}' % result, "utf-8"))

if __name__ == "__main__":
    web_server = HTTPServer((hostName, host_name), ProjVisServer)
    print("Server started http://%s:%s" % (host_name, host_name))

    try:
        web_server.serve_forever()
    except KeyboardInterrupt:
        pass

    web_server.server_close()
    print("Server stopped.")
