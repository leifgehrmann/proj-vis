FROM python:3.10
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -y install proj-bin && rm -rf /var/lib/apt/lists/* && pip install pyproj

ENV SRC_DIR /usr/bin/src/webapp/src
COPY src/* ${SRC_DIR}/
WORKDIR ${SRC_DIR}

EXPOSE 7765

CMD ["python", "server.py"]
