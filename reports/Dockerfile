# Start with a Maven image that includes JDK 17
# AS build names this stage "build" so we can reference it late
FROM maven:3.9.9-eclipse-temurin-17 AS build
# Set the working directory inside the container to /workspace
# All subsequent commands run from here
WORKDIR /workspace

# Copy Maven config files from your project:
# pom.xml - project dependencies and build config
COPY pom.xml ./
# .mvn/ - Maven wrapper settings
COPY .mvn .mvn
# mvnw - Maven wrapper shell script (lets you build without Maven installed)
COPY mvnw ./

# Make the Maven wrapper executable (Windows → Linux permission fix)
RUN chmod +x mvnw
# Download all dependencies ahead of time
# -q = quiet mode (less verbose output)
# This step caches dependencies, so rebuilds are faster if pom.xml hasn't changed
RUN ./mvnw -q dependency:go-offline

# Copy Java source code into the container
COPY src ./src
# Compile the code and create a JAR file
# -DskipTests = skip running unit tests (faster build)
# package = creates /workspace/target/reports-*.jar
RUN ./mvnw -q -DskipTests package

# Start fresh with a lightweight JRE-only image
# This stage doesn't have Maven or build tools (smaller, faster, more secure)
FROM eclipse-temurin:17-jre
# Set the working directory inside the container to /app
WORKDIR /app

# Copy the JAR file from the build stage into this new image
# --from=build = grab it from the "build" stage
# /workspace/target/reports-*.jar = source (from build stage)
# /app/app.jar = destination (rename to app.jar for clarity)
COPY --from=build /workspace/target/reports-*.jar /app/app.jar

# Cloud Run provides PORT at runtime; default to 8080 for local Docker runs.
ENV PORT=8080
EXPOSE 8080
# Pass Cloud Run's port to Spring Boot and replace the shell with the application.
ENTRYPOINT ["sh", "-c", "exec java -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
