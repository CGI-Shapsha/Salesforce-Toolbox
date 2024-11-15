# summary

Launches the job to update local Profiles.

# description

Update all local Profiles with permissions retrieved from a specified Org, according to the config file.

# examples

sf CGI profiles update --target-org myOrg@example.com --config ./config.json
sf CGI profiles update -o myOrgAlias -c ./config.json
sf CGI profiles update

# flags.config.summary

Path to the config file.

# flags.config.description

Optionnal - Path to the config file. If not provided, it will be loaded from the default location. If it does not exist, throw an error.
