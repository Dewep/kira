# Kira

Camera

## Tasmota

- Tasmota installation
  - https://tasmota.github.io/install/
  - Tasmota32-Webcam
  - Connect on the new network wifi
  - Setup correct wifi credentials
- Tasmota commands
  - https://cgomesu.com/blog/Esp32cam-tasmota-webcam-server/
  - Set correct template
  - WsStream 0
  - WsResolution 12
- Snapshot image
  - http://192.168.X.Y/snapshot.jpg
- Set light level (0=off, 100=max)
  - http://192.168.X.Y/?m=1&d0=0
  - http://192.168.X.Y/?m=1&d0=50
  - http://192.168.X.Y/?m=1&d0=100

## SSH forward

```bash
ssh -N -R 4181:192.168.1.19:80 root@sw.dewep.net
```
