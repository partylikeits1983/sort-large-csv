# Sort Large CSV Files with Limited Resources

This repository demonstrates how to use PostgreSQL for external sorting of large CSV files, especially on a machine with limited resources. Docker is used for containerization, enabling to simulate an environment with specific hardware constraints.

## How It Works:

1. **Generate a large mock CSV file**: You can specify the file size (in MB) as per your needs.
2. **Build two Docker containers**: One is for importing the large CSV file, and the other one is for running the PostgreSQL server.
3. **Execute the Docker containers to sort the CSV file**: These containers operate within the defined resource limits.

> **Resource Allocation Note**: The import script is allocated 200 MB of RAM, while the PostgreSQL server is given 300 MB of RAM.

> **Developer's Note**: Before running the commands listed below, ensure that you do not have a PostgreSQL server running on port 5432 already.

## Running the CSV Sort Procedure:

Execute the following shell commands in the order they are presented:

```sh
ts-node src/generate-csv.ts
sudo docker rm -f $(sudo docker ps -a -q)
sudo docker build -t sortcsv .
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -m 200m -d postgres:latest
sudo docker run --name sortcsv --link postgres:postgres -p 3000:3000 -m 300m -d sortcsv
sudo docker logs sortcsv
```

## Monitoring the Import Status

Use the script below to continuously check the import status:

```sh
function getLogs() {
    sudo docker logs sortcsv
}

while true; do
  getLogs
  sleep 3
done
```

## Completion and Verification

Wait for the import process to complete. If you proceed before the sorting process finishes, the `output.csv` will not be complete. When the output file's size matches the input file's size, you can consider the sorting as completed. The output.csv will be in ascending order when postgres is complete.

Execute the following commands to copy the output file and verify the results:

```sh
sudo docker cp sortcsv:/app/src/output.csv .
ts-node src/verify.ts
```

## @dev Miscellaneous Docker Commands

#### Building the container:

```sh
sudo docker build -t sortcsv .
```

#### Starting the PostgreSQL container:

```sh
sudo docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:latest
```

#### Starting the sorting script:

```sh
sudo docker run --name sortcsv -e POSTGRES_PASSWORD=password -p 5432:5432 -d sortcsv
```

#### Removing all containers at once:

```sh
sudo docker rm -f $(sudo docker ps -a -q)
```
