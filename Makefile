
# variables
PROJECTNAME=$(shell basename "$(PWD)")
VENV=venv

.PHONY: all test clean venv

all: run

$(VENV): requirements.txt
	python3 -m venv $(VENV)
	./$(VENV)/bin/pip install -r requirements.txt

venv: $(VENV)

install: venv

run: install
	./$(VENV)/bin/python manage.py runserver

gunicorn: install
	./$(VENV)/bin/gunicorn myproject.wsgi:application --bind 0.0.0.0:8000

migrations:
	./$(VENV)/bin/python manage.py makemigrations

migrate:
	./$(VENV)/bin/python manage.py migrate

superuser:
	./$(VENV)/bin/python manage.py createsuperuser

clean:
	rm -rf $(VENV)
	find . -type f -name '*.pyc' -delete
	find . -type f -name '*.pyo' -delete
	find . -type d -name '__pycache__' -exec rm -rf {} +

test: install
	./$(VENV)/bin/python manage.py test
