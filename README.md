# Tiquismiquis bot

## Development

- Al desplegar en Heroku, es necesario especificar un nombre de trabajo propio en el fichero ./Procfile, (en este caso 'bot'), y no emplear el 'web' que viene por defecto.


### Comandos de despliegue

Es necesario tener instalado Heroku.

El repositorio de despliegue en Heroku es 'heroku.com/tiquismiquis-bot2'.

	# Arrancar el bot
	$ heroku ps:scale bot=1

	# Parar el bot
	$ heroku ps:scale bot=0

	# Veure els logs
	$ heroku logs
