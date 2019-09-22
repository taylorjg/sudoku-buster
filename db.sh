#!/bin/bash

set -euo pipefail

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

export $(cat "$DIR"/.env | xargs)

usage()
{
  echo "db.sh"
  echo "  --local < --shell | --run | --start | --stop | --rm >"
  echo "  --heroku < --shell >"
}

local_shell()
{
  docker exec \
    --interactive \
    --tty \
    mongo-sudoku-buster \
    mongo
}

local_run()
{
  docker run \
    --name mongo-sudoku-buster \
    --publish 27017:27017 \
    --detach \
    mongo:4.2
}

local_start()
{
  docker start mongo-sudoku-buster
}

local_stop()
{
  docker stop mongo-sudoku-buster
}

local_rm()
{
  docker rm mongo-sudoku-buster
}

heroku_shell()
{
  docker exec \
    --interactive \
    --tty \
    mongo-sudoku-buster \
    mongo "$HEROKU_DB_DATABASE" \
      --username "$HEROKU_DB_USERNAME" \
      --password "$HEROKU_DB_PASSWORD" \
      --host "$HEROKU_DB_HOST" \
      --port "$HEROKU_DB_PORT"
}

case "${1:-}" in
  --local)
    case "${2:-}" in
      --shell) local_shell ;;
      --run) local_run ;;
      --start) local_start ;;
      --stop) local_stop ;;
      --rm) local_rm ;;
      *) usage; exit 1 ;;
    esac
    ;;

  --heroku)
    case "${2:-}" in
      --shell) heroku_shell ;;
      *) usage; exit 1 ;;
    esac
    ;;

  -h | --help) usage ;;

  *) usage; exit 1 ;;
esac
