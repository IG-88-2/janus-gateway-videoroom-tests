# janus-gateway-videoroom-tests
This repo contains a simple test for [react-videoroom-janus](https://github.com/IG-88-2/react-videoroom-janus) and
[janus-gateway-node](https://github.com/IG-88-2/janus-gateway-node) packages.
![alt text](https://github.com/IG-88-2/janus-gateway-videoroom-tests/blob/master/test.jpg?raw=true)
## Usage
Before running make sure you have installed all submodules together with dependencies and compiled them.
Test will autostart janus docker containers so make sure to close them before test either manually or by running npm run containers:terminate  

```
npm run build
...
npm run test
```
## Contributing
Please consider to help by providing feedback on how this project can be 
improved or what is missing to make it useful for community. Thank you!
## Authors

* **Anatoly Strashkevich**

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
