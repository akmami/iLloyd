.PHONY: all clean venv

all: start

venv:
	python3 -m venv venv
	./venv/bin/pip install -r requirements.txt

install: venv
	sudo npm install -g concurrently;
	cd frontend && npm install;

start:
	concurrently "make run-django" "make run-node"

run-django:
	./venv/bin/python manage.py runserver 0.0.0.0:8000

run-node:
	unset HOST;
	cd frontend && HOST=localhost npm start

clean:
	rm -rf venv
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type d -name '__pycache__' -exec rm -rf {} +
