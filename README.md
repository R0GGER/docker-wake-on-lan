# WAKE ON LAN

**Run container:**
```
docker run -d --name wake-on-lan --net=host -e MAC='11:11:11:11:11:11' r0gger/docker-wake-on-lan
```
    
or add multiple mac-addresses (space seperated):  
```
docker run -d --name wake-on-lan --net=host -e MAC='11:11:11:11:11:11 22:22:22:22:22:22 33:33:33:33:33:33' r0gger/docker-wake-on-lan
```
   
**Run container and clean-up container after successfull run:**
```
docker run --rm --name wake-on-lan --net=host -e MAC='11:11:11:11:11' r0gger/docker-wake-on-lan
```

* `--rm` - remove container after succesfull run.
* `--net=host` - attach container to the host network interface (otherwise the wake command could not get through the docker network bridge).
* `-e MAC='11:11:11:11:11:11'` - specify the MAC address of the computer you want to wake.   

For more information about Awake, go to: https://github.com/cyraxjoe/awake
