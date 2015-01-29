.PHONY: help test

# Determine reporter
reporter=tap
ifdef npm_config_dot
	reporter=dot
endif
ifdef npm_config_spec
	reporter=spec
endif

all: help

help:
	@echo
	@echo "To run tests:"
	@echo "  [grep=pattern] npm test [--dot | --spec] [--coverage]"
	@echo

test:
	@jshint --exclude '**/{coverage,node_modules}/*' **/*.js
	$(if $(grep), @echo "Running test files that match pattern: $(grep)\n",)
	$(if $(filter tap, $(reporter)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape --)
	$(if $(filter dot, $(reporter)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape -- | tap-dot)
	$(if $(filter spec, $(reporter)), @find ./test -name "*.js" -type f -maxdepth 1 | grep ""$(grep) | xargs istanbul cover --report lcovonly --print none tape -- | tap-spec)
ifdef npm_config_coverage
	@echo
	@istanbul report text | grep -v "Using reporter" | grep -v "Done"
endif
	@istanbul report html > /dev/null
	@rm -f coverage/error
	@istanbul check-coverage --statements 100 --branches 100 --functions 100 --lines 100 2>&1 | cat > coverage/error
	$(if $(grep),,@if [ -s coverage/error ]; then echo; grep ERROR coverage/error; echo; exit 1; fi)
