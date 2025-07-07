#!/bin/sh
set -e

# Inicia o Asterisk em modo de console, em primeiro plano
# A flag -f impede que ele vá para o background
# A flag -c fornece um console se você se conectar ao contêiner (docker attach)
exec asterisk -f -c 