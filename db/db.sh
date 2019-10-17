#!/bin/bash

set -euo pipefail

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

export $(cat "$DIR"/.env | xargs)

usage()
{
  echo "db.sh"
  echo "  --local  < --shell | --create | --show | --run | --start | --stop | --rm >"
  echo "  --heroku < --shell | --create | --show >"
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
    --volume "$DIR":/db_scripts \
    --detach \
    mongo:4.2
}

local_run_sql_script()
{
  docker exec \
    --interactive \
    --tty \
    mongo-sudoku-buster \
    mongo \
      --quiet \
      "/db_scripts/$1"
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
    mongo \
      --username "$HEROKU_DB_USERNAME" \
      --password "$HEROKU_DB_PASSWORD" \
      --host "$HEROKU_DB_HOST" \
      --port "$HEROKU_DB_PORT" \
      "$HEROKU_DB_DATABASE"
}

heroku_run_sql_script()
{
  docker exec \
    --interactive \
    --tty \
    mongo-sudoku-buster \
    mongo \
      --username "$HEROKU_DB_USERNAME" \
      --password "$HEROKU_DB_PASSWORD" \
      --host "$HEROKU_DB_HOST" \
      --port "$HEROKU_DB_PORT" \
      --quiet \
      "$HEROKU_DB_DATABASE" \
      "/db_scripts/$1"
}

case "${1:-}" in
  --local)
    case "${2:-}" in
      --shell)  local_shell ;;
      --create) local_run_sql_script "db_create.js" ;;
      --show)   local_run_sql_script "db_show.js" ;;
      --run)    local_run ;;
      --start)  local_start ;;
      --stop)   local_stop ;;
      --rm)     local_rm ;;
      *) usage; exit 1 ;;
    esac
    ;;

  --heroku)
    case "${2:-}" in
      --shell)  heroku_shell ;;
      --create) heroku_run_sql_script "db_create.js" ;;
      --show)   heroku_run_sql_script "db_show.js" ;;
      *) usage; exit 1 ;;
    esac
    ;;

  -h | --help) usage ;;

  *) usage; exit 1 ;;
esac
