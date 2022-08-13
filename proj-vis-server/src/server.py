from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from urllib.parse import parse_qs
import math
import json
from typing import Tuple, List
from pyproj import CRS, Transformer

host_name = '0.0.0.0'
server_port = 7765

def generate_coordinates(
    transformer: Transformer,
    min_x: float,
    min_y: float,
    max_x: float,
    max_y: float,
    step: float,
    offset: int,
    limit: int
) -> List[Tuple[float, float]]:
    # To mitigate against floating-point precision errors, we multiply the
    # values by a scale factor and then un-multiply them.
    scale = 1000000
    x_range = max_x * scale - min_x * scale
    y_range = max_y * scale - min_y * scale
    x_count = math.floor(x_range / step / scale) + 1
    y_count = math.floor(y_range / step / scale) + 1

    pos = offset
    count = 0

    points = []

    while pos < x_count * y_count:
        x = min_x + (pos % x_count) * step
        y = min_y + math.floor(((pos * scale) / x_count) / scale) * step
        point = transformer.transform(x, y)
        if point[0] == float('inf') or point[1] == float('inf') \
            or point[0] == float('-inf') or point[1] == float('-inf'):
            points.append((None, None))
        else:
            points.append(point)

        count += 1
        if count == limit:
            return points
        pos += 1

    return points

class ProjVisServer(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        parsed_query = parse_qs(parsed_path.query)

        proj_from = '+proj=longlat +datum=WGS84 +no_defs +type=crs'
        proj_to = '+proj=longlat +datum=WGS84 +no_defs +type=crs'
        min_x = 0.0
        min_y = 0.0
        max_x = 0.0
        max_y = 0.0
        step = 1.0
        offset = 0
        limit = 1
        if 'projFrom' in parsed_query:
            proj_from = parsed_query['projFrom'][0]
        if 'projTo' in parsed_query:
            proj_to = parsed_query['projTo'][0]
        if 'minX' in parsed_query:
            min_x = float(parsed_query['minX'][0])
        if 'minY' in parsed_query:
            min_y = float(parsed_query['minY'][0])
        if 'maxX' in parsed_query:
            max_x = float(parsed_query['maxX'][0])
        if 'maxY' in parsed_query:
            max_y = float(parsed_query['maxY'][0])
        if 'step' in parsed_query:
            step = float(parsed_query['step'][0])
        if 'offset' in parsed_query:
            offset = max(0, int(parsed_query['offset'][0]))
        if 'limit' in parsed_query:
            limit = max(1, int(parsed_query['limit'][0]))

        # This API can also be used to query individual coordinates.
        if 'x' in parsed_query:
            min_x = float(parsed_query['x'][0])
            max_x = float(parsed_query['x'][0])
        if 'y' in parsed_query:
            min_y = float(parsed_query['y'][0])
            max_y = float(parsed_query['y'][0])

        try:
            transformer = Transformer.from_proj(
                CRS.from_string(proj_from),
                CRS.from_string(proj_to)
            )
            coordinates = generate_coordinates(
                transformer,
                min_x,
                min_y,
                max_x,
                max_y,
                step,
                offset,
                limit
            )
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            coordinates_json = json.dumps(coordinates)
            self.wfile.write(bytes('%s' % coordinates_json, "utf-8"))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            message = repr(e)
            message_json = json.dumps(message)
            self.wfile.write(bytes('%s' % message_json, "utf-8"))

if __name__ == "__main__":
    web_server = HTTPServer((host_name, server_port), ProjVisServer)
    print("Server started http://%s:%s" % (host_name, server_port))

    try:
        web_server.serve_forever()
    except KeyboardInterrupt:
        pass

    web_server.server_close()
    print("Server stopped.")
