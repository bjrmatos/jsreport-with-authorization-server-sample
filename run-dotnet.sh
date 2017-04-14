
cd authorization-server
hostIp=$1
export ASPNETCORE_ENVIRONMENT=Development
export HOST_IP=${hostIp}
dotnet restore
dotnet run
