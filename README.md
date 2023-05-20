## Sort Large CSV file on machine with limited resources

## build container
``sh
sudo docker build -t sortcsv .
``

## Start postgres container
``sh
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:latest
``

## start script
``sh
sudo docker run --name sortcsv -e POSTGRES_PASSWORD=password -p 5432:5432 -d sortcsv
``

## rm all containers at once 
sudo docker rm -f $(sudo docker ps -a -q)


## Run all:
``sh
ts-node src/generate-csv.ts
sudo docker rm -f $(sudo docker ps -a -q)
sudo docker build -t sortcsv .
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -m 300m -d postgres:latest
sudo docker run --name sortcsv --link postgres:postgres -p 3000:3000 -m 200m -d sortcsv
sudo docker logs sortcsv
``

## When complete run:
``sh
sudo docker cp sortcsv:/app/src/output.csv .
ts-node src/verify.ts
``
