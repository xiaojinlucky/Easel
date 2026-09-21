#!/bin/sh
# WSL systemd services alone do not keep the distribution running.
# stdin is owned by Easel's Windows process; closing it ends this foreground job.
cat >/dev/null
