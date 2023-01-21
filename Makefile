all: enable build run
.PHONY: all

enable:
	sudo systemctl start docker && sudo systemctl start postgresql

build:
	docker build -t ivan_bir .

run:
	docker run --rm -p 5000:5000 --name ivan_bir -t ivan_bir

start:
	make build && make run

stop:
	docker stop ivan_bir

restart:
	make stop && make build && make run

info:
	docker ps -a
