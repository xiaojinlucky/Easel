// Native Messaging launcher for Windows. Chrome's host "path" cannot take
// arguments, and a .cmd wrapper writes extra bytes / error events on the pipe.
package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	exe, err := os.Executable()
	if err != nil {
		os.Exit(1)
	}
	dir := filepath.Dir(exe)
	raw, err := os.ReadFile(filepath.Join(dir, "python-path.txt"))
	if err != nil {
		os.Exit(1)
	}
	python := strings.TrimSpace(string(raw))
	script := filepath.Join(dir, "beav_native_host.py")
	cmd := exec.Command(python, "-u", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), "PYTHONUTF8=1")
	if err := cmd.Run(); err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			os.Exit(ee.ExitCode())
		}
		os.Exit(1)
	}
}
