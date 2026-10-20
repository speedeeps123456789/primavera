.PHONY: all build test proof clean

SOURCES=$(wildcard sources/*.glyphs)
CONFIG=sources/config.yaml

all: build test

build:
	cd sources && gftools builder config.yaml

test:
	fontbakery check-googlefonts fonts/variable/*.ttf --html report.html --json report.json

proof:
	gftools gen-html proof fonts/variable/*.ttf -o out/proof/

clean:
	rm -rf build/
