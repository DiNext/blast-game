# Blast Game

Прототип игры-головоломки с механикой **Blast** на **TypeScript + Cocos Creator 2.4.15.

## Разработка ядра (без Cocos Creator)

```bash
npm install
npm test          # unit-тесты игрового ядра
npm run test:cov  # с покрытием
npm run typecheck # проверка типов
```

## Архитектура (SOLID + разделение логики/отображения)

Логика и отображение разделены:

- `assets/scripts/core/` — **headless игровое ядро** на чистом TypeScript, без зависимостей
  от Cocos. Полностью покрыто unit-тестами (Jest), запускается в Node без редактора.
- `assets/scripts/view/` — слой представления Cocos Creator (M2+), подписан на доменные
  события ядра и проигрывает анимации.

Идея: **headless игровое ядро на чистом TS без единого `import` из Cocos** + тонкий слой представления Cocos, подписанный на события ядра.

```
src/
├─ core/                      ← чистый TS, тестируемый Jest, ноль зависимостей от Cocos
│  ├─ model/      Tile, Cell, Board, GameState, GameConfig
│  ├─ services/   GroupFinder (flood fill 4-связность)
│  │              BurnService, GravityService, RefillService
│  │              DeadlockDetector + ShuffleService
│  │              ScoreService, WinLoseEvaluator
│  ├─ boosters/   IBooster, BombBooster, TeleportBooster (Strategy)
│  ├─ supertile/  ISuperTileEffect: Row/Column/Radius/Field (Strategy)
│  ├─ GameEngine  ← фасад: принимает команды (tapCell, useBooster…)
│  └─ events/     доменные события + типизированная шина
│
└─ view/                      ← Cocos Creator слой
   ├─ BoardView, TileView     слушают события ядра, играют твины
   ├─ AnimationSequencer      проигрывает очередь событий как таймлайн
   ├─ ui/                     счёт, ходы, цель, кнопки бустеров, модалки
   └─ input/                  тач + мышь
```

## Слой Cocos (M2+)

Требуется **Cocos Creator 2.4.x** (через Cocos Dashboard). Ядро от редактора не зависит.

View-скрипты в `assets/scripts/view/` уже написаны и строят сцену программно —
ручной сборки в редакторе минимум:

1. Открыть проект папкой `blast-game` в Cocos Creator 2.4.x.
2. Создать сцену `assets/scene/Game.fire`.
3. В сцене на узле **Canvas** выставить Design Resolution `1080×1920`, Fit Height + Fit Width.
4. Повесить на Canvas компонент **GameController** (`assets/scripts/view/GameController.ts`).
5. Запустить превью — фон, поле, HUD, бустеры и модалки строятся в рантайме
   из `assets/resources/textures/`. Прочих привязок не требуется.

Параметры баланса (`rows/cols/targetScore/maxMoves`) — поля компонента
GameController в инспекторе; остальное в `core/model/GameConfig.ts`.

## Игровые правила (дефолты, конфигурируемо в `GameConfig`)

- Поле 9×9, 5 цветов, минимальная группа для сжигания — 2
- Очки за группу: `size * (size - 1) * scoreBase`, `scoreBase = 3`
- Цель: 1000 очков за 20 ходов; иначе проигрыш
- Авто-перемешивание при дедлоке, до 3 раз суммарно → проигрыш
- Бустеры «бомба» и «телепорт» — по 3 заряда, заряд **не** тратит ход

### Супер-тайлы (по форме и размеру сожжённой группы, по приоритету)

1. **Ракета** — если группа лежит идеально в одной линии и `size >= 4`:
   - вся в одной строке → горизонтальная ракета, активация сжигает **строку**;
   - вся в одном столбце → вертикальные ракеты, активация сжигает **столбец**.
2. **Большая бомба** (`bomb_max`) — произвольная группа `size >= 7`:
   активация сжигает **всё поле**.
3. **Обычная бомба** — произвольная группа `size >= 5`:
   активация сжигает тайлы в радиусе `R = 1` (область 3×3).
4. Иначе супер-тайл не создаётся.

Супер-тайл появляется на месте клика; клик по нему активирует его эффект и тратит ход.
Бустер «бомба» (отдельная механика) сжигает радиус `R = 1` вокруг клика.

Пороги настраиваются: `rocketLineThreshold = 4`, `bombThreshold = 5`,
`fieldBombThreshold = 7` в `core/model/GameConfig.ts`.
