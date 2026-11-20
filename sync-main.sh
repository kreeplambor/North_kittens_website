#!/usr/bin/env bash
# Синхронизирует локальную ветку main с origin/main.
#
# Использование:
#   ./sync-main.sh          обновить main (только fast-forward)
#   ./sync-main.sh --reset  принудительно сбросить main до origin/main
#
# Скрипт не делает push и не изменяет другие ветки.

set -euo pipefail

REMOTE="origin"
BRANCH="main"
RESET=0

usage() {
  cat <<'EOF'
Синхронизация локальной ветки main с origin/main.

Использование:
  ./sync-main.sh [--reset]

Параметры:
  --reset      Если main разошёлся с origin/main, жёстко сбросить его
               до origin/main. Локальные коммиты в main будут потеряны.
  -h, --help   Показать эту справку.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --reset) RESET=1 ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Неизвестный параметр: $arg" >&2
      echo >&2
      usage >&2
      exit 2
      ;;
  esac
done

# Работаем из корня репозитория, даже если скрипт запущен из другой папки.
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v git >/dev/null 2>&1; then
  echo "Ошибка: git не найден. Установите Git и повторите попытку." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Ошибка: скрипт запущен вне git-репозитория." >&2
  exit 1
fi

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
DIRTY="$(git status --porcelain --untracked-files=no)"

# Переключение ветки с незакоммиченными изменениями может перенести их
# в main, поэтому требуем чистое рабочее дерево.
if [ "$CURRENT_BRANCH" != "$BRANCH" ] && [ -n "$DIRTY" ]; then
  echo "Ошибка: в рабочей копии есть незакоммиченные изменения." >&2
  echo "Закоммитьте их или сохраните командой «git stash», затем повторите запуск." >&2
  exit 1
fi

echo "Получаю изменения из $REMOTE..."
if ! git fetch --prune "$REMOTE"; then
  echo "Ошибка: не удалось получить изменения из $REMOTE. Проверьте подключение к сети." >&2
  exit 1
fi

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    echo "Переключаюсь на ветку $BRANCH..."
    git switch --quiet "$BRANCH"
  else
    echo "Создаю локальную ветку $BRANCH от $REMOTE/$BRANCH..."
    git switch --quiet --create "$BRANCH" --track "$REMOTE/$BRANCH"
  fi
fi

BEFORE="$(git rev-parse --short HEAD)"

if git -c advice.diverging=false merge --ff-only --quiet "$REMOTE/$BRANCH"; then
  AFTER="$(git rev-parse --short HEAD)"

  if [ "$BEFORE" = "$AFTER" ]; then
    echo "Ветка $BRANCH уже актуальна ($AFTER)."
  else
    echo "Ветка $BRANCH обновлена: $BEFORE → $AFTER."
    git --no-pager log --no-decorate --format='  %h %s' "$BEFORE..$AFTER"
  fi

  AHEAD="$(git rev-list --count "$REMOTE/$BRANCH..HEAD")"
  if [ "$AHEAD" -gt 0 ]; then
    echo "Внимание: в $BRANCH есть локальные коммиты без push: $AHEAD."
  fi
else
  if [ "$RESET" -eq 1 ]; then
    echo "Ветка $BRANCH разошлась с $REMOTE/$BRANCH, сбрасываю до $REMOTE/$BRANCH..."
    git reset --hard "$REMOTE/$BRANCH"
    echo "Готово: $BRANCH теперь на $(git rev-parse --short HEAD)."
  else
    echo "Ошибка: не удалось обновить $BRANCH по fast-forward." >&2
    if git merge-base --is-ancestor "$REMOTE/$BRANCH" HEAD; then
      echo "В $BRANCH есть коммиты, которых нет в $REMOTE/$BRANCH (не запушены)." >&2
    elif git merge-base --is-ancestor HEAD "$REMOTE/$BRANCH"; then
      echo "Ветка $BRANCH отстаёт от $REMOTE/$BRANCH, но обновлению мешают локальные файлы." >&2
      echo "Проверьте незакоммиченные и неотслеживаемые файлы (git status)." >&2
    else
      echo "Локальная ветка $BRANCH разошлась с $REMOTE/$BRANCH." >&2
      echo "Разрешите расхождение вручную (merge или rebase) либо запустите скрипт с --reset." >&2
    fi
    exit 1
  fi
fi

echo
echo "Готово: $(git branch --show-current) на $(git rev-parse --short HEAD)."
