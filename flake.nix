{
  description = "Web dev shell — Node.js + pnpm";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            typescript
            typescript-language-server
            chromium # navegador para correr las pruebas de Karma
          ];

          shellHook = ''
            export CHROME_BIN="${pkgs.chromium}/bin/chromium"
            echo "🌐 Web devShell — Node $(node -v) / pnpm $(pnpm -v)"
          '';
        };
      });
}
