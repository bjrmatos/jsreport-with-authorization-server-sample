FROM microsoft/dotnet:1.1.1-sdk

# RUN apt-get update
# RUN apt-get -qq update

COPY ./authorization-server.csproj /app/
COPY ./NuGet.Config /app/
WORKDIR /app/
RUN dotnet restore
ADD ./ /app/

RUN dotnet publish -c Debug

EXPOSE 5000
ENTRYPOINT ["dotnet", "run"]