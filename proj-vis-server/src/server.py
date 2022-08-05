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
    min_lon: float,
    min_lat: float,
    max_lon: float,
    max_lat: float,
    step: float,
    offset: int,
    limit: int
) -> List[Tuple[float, float]]:
    lon_range = max_lon - min_lon
    lat_range = max_lat - min_lat
    lon_count = math.floor(lon_range / step)
    lat_count = math.floor(lat_range / step)

    lon = min_lon + offset % lon_count * step
    lat = min_lat + math.floor(offset / lon_count) * step

    count = 0

    points = []

    while lat < max_lat:
        while lon < max_lon:
            point = transformer.transform(lat,lon)
            if point[0] == float('inf') or point[1] == float('inf'):
                points.append([None, None])
            else:
                points.append(point)

            count += 1
            if count >= limit:
                return points
            lon += step
        lon = min_lon
        lat += step

    return points

class ProjVisServer(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        parsed_query = parse_qs(parsed_path.query)

        proj = parsed_query['proj'][0]
        min_lon = float(parsed_query['minLon'][0])
        min_lat = float(parsed_query['minLat'][0])
        max_lon = float(parsed_query['maxLon'][0])
        max_lat = float(parsed_query['maxLat'][0])

        step = 1.0
        if 'step' in parsed_query:
            step = float(parsed_query['step'][0])

        offset = 0
        if 'offset' in parsed_query:
            offset = int(parsed_query['offset'][0])

        limit = 1
        if 'limit' in parsed_query:
            limit = int(parsed_query['limit'][0])

        transformer = Transformer.from_proj(
            CRS.from_epsg(4326),
            CRS.from_proj4(proj)
        )

        coordinates = generate_coordinates(
            transformer,
            min_lon,
            min_lat,
            max_lon,
            max_lat,
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

if __name__ == "__main__":
    web_server = HTTPServer((host_name, server_port), ProjVisServer)
    print("Server started http://%s:%s" % (host_name, server_port))

    try:
        web_server.serve_forever()
    except KeyboardInterrupt:
        pass

    web_server.server_close()
    print("Server stopped.")
