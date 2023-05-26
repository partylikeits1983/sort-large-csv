## Sort Large CSV file on machine with limited resources

This repository is an example of how to use postgreSQL for external sort of a large CSV file.
Using docker in order to containerize the code to simulate a machine with limited resources.


## How this code works:
1) Generate large mock CSV file (you can specify the size in MB)
2) Build two docker containers: one for the import of the large csv, the other for postgres
3) Run the docker containers to sort the CSV.

## Note:
The import script has 200 mb of ram and the postgres server has 300 mb of ram
The 


#### Note to dev:
Before running commands below, make sure you do not have a postgres server already running on port 5432


## Run CSV sort:
``sh
ts-node src/generate-csv.ts
sudo docker rm -f $(sudo docker ps -a -q)
sudo docker build -t sortcsv .
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -m 200m -d postgres:latest
sudo docker run --name sortcsv --link postgres:postgres -p 3000:3000 -m 300m -d sortcsv
sudo docker logs sortcsv
``

## View status of import
```sh
function getLogs() {
    sudo docker logs sortcsv
}

while true; do
  getLogs
  sleep 5
done
```

## Wait for import to complete, when finished, run:
Note that you must wait for postgres to finish sorting, else, the output.csv will not be complete.

``sh
sudo docker cp sortcsv:/app/src/output.csv .
ts-node src/verify.ts
``



## @dev misc docker commands: 
### build container
``sh
sudo docker build -t sortcsv .
``

### Start postgres container
``sh
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:latest
``

### start script
``sh
sudo docker run --name sortcsv -e POSTGRES_PASSWORD=password -p 5432:5432 -d sortcsv
``

### rm all containers at once 
sudo docker rm -f $(sudo docker ps -a -q)
