## WAKE ON LAN

Run container:
```
docker run -d --name wake-on-lan --net=host -e MAC='11:11:11:11:11:11' r0gger/wake-on-lan
```

Run container and clean-up container after successfull run:
```
docker run --rm --name wake-on-lan --net=host -e MAC='11:11:11:11:11' r0gger/wake-on-lan
```

* `--rm` - clean up container after succesfull run.
* `--net=host` - attach container to the host network interface (otherwise the wake command could not get through the docker network bridge).
* `-e MAC='11:11:11:11:11:11'` - specify the MAC address of the computer you want to wake.


*More info about Awake: https://github.com/cyraxjoe/awake*
