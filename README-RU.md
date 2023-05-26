# Сортировка больших CSV файлов с ограниченными ресурсами

Этот репозиторий демонстрирует, как использовать PostgreSQL для внешней сортировки больших CSV файлов, особенно на машине с ограниченными ресурсами. Docker используется для контейнеризации, что позволяет нам симулировать окружение с определенными ограничениями аппаратного обеспечения.

## Как это работает:

1) **Создайте большой тестовый CSV файл**: Вы можете указать размер файла (в МБ) согласно своим потребностям.
2) **Создайте два Docker контейнера**: Один предназначен для импорта большого CSV файла, а другой - для запуска сервера PostgreSQL.
3) **Запустите Docker контейнеры для сортировки CSV файла**: Эти контейнеры работают в пределах заданных ограничений ресурсов.

> **Примечание о распределении ресурсов**: Скрипту импорта выделено 200 МБ оперативной памяти, в то время как серверу PostgreSQL предоставлено 300 МБ оперативной памяти.

> **Примечание для разработчика**: Перед запуском команд, перечисленных ниже, убедитесь, что у вас уже не запущен сервер PostgreSQL на порту 5432.

## Процесс сортировки CSV:

Выполните следующие команды shell в том порядке, в котором они представлены:

```sh
ts-node src/generate-csv.ts
sudo docker rm -f $(sudo docker ps -a -q)
sudo docker build -t sortcsv .
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -m 200m -d postgres:latest
sudo docker run --name sortcsv --link postgres:postgres -p 3000:3000 -m 300m -d sortcsv
sudo docker logs sortcsv
```

## Мониторинг состояния импорта

Используйте следующий скрипт для непрерывной проверки состояния импорта:

```sh
function getLogs() {
    sudo docker logs sortcsv
}

while true; do
  getLogs
  sleep 3
done
```

## Завершение и проверка

Дождитесь завершения процесса импорта. Если вы продолжите до завершения процесса сортировки, `output.csv` будет неполным. Когда размер выходного файла совпадает с размером входного файла, можно считать, что сортировка завершена.

Выполните следующие команды для копирования выходного файла и проверки результатов:

```sh
sudo docker cp sortcsv:/app/src/output.csv .
ts-node src/verify