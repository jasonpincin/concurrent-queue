.PHONY: help clean coverage-check browse-coverage coverage-report coverage-html-report test test-tap test-dot test-spec npm-test travis-test

BIN = ./node_modules/.bin

all: lint test coverage-html-report coverage-report coverage-check

help:
	@echo
	@echo "To run tests:"
	@echo "  npm test [--dot | --spec] [--grep=<test file pattern>]"
	@echo
	@echo "To see coverage:"
	@echo "  npm run coverage [--html]"
	@echo

npm-test: lint test coverage-check

travis-test: lint test coverage-check
	@(cat coverage/lcov.info | coveralls) || exit 0

npm-coverage: coverage-report coverage-html-report
ifdef npm_config_html
	@make browse-coverage
endif

lint:
	@$(BIN)/standard

test:
	$(if $(npm_config_grep), @echo "Running test files that match pattern: $(npm_config_grep)\n",)
ifdef npm_config_dot
	@make test-dot
else
ifdef npm_config_spec
	@make test-spec
else
	@make test-tap
endif
endif

test-tap:
	@find ./test -maxdepth 1 -name "*.js" -type f | grep ""$(npm_config_grep) | xargs $(BIN)/istanbul cover --report lcovonly --print none $(BIN)/tape --

test-dot:
	@make test-tap | $(BIN)/tap-dot

test-spec:
	@make test-tap | $(BIN)/tap-spec

coverage:
	@make test

coverage-check: coverage
	@rm -f coverage/error
	@$(BIN)/istanbul check-coverage --statements 100 --branches 100 --functions 100 --lines 100 2>&1 | cat > coverage/error
	$(if $(npm_config_grep),,@if [ -s coverage/error ]; then echo; grep ERROR coverage/error; echo; exit 1; fi)

coverage-report: coverage
	@$(BIN)/istanbul report text #| grep -v "Using reporter" | grep -v "Done"

coverage-html-report: coverage
	@$(BIN)/istanbul report html > /dev/null

browse-coverage: coverage-html-report
	@$(BIN)/opn coverage/index.html

clean:
	@rm -rf coverage
