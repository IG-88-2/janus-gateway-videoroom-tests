import { pause } from "./pause";
const { exec } = require('child_process');



let closeBrowser = async (browser) => {
    
    let pid = browser.process().pid;

    let p = new Promise(
        resolve => browser.on('disconnected', () => {
            
            setTimeout(function(){

                if (process.platform==="linux") {
                    exec(`kill -9 ${pid}`, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`${process.platform} -> Process Kill Error: ${error}`)
                        }
                        //console.log(`Process Kill Success. stdout: ${stdout} stderr:${stderr}`);
                    });
                } else {
                    exec(`taskkill /PID ${pid}`, (error, stdout, stderr) => {
                        if (error) {
                            console.log(`${process.platform} -> Process Kill Error: ${error}`)
                        }
                        //console.log(`Process Kill Success. stdout: ${stdout} stderr:${stderr}`);
                    });
                }
                
                resolve(process);
                
            });

        })
    );
    
    await browser.disconnect();
    
    await p;
}



let closePage = async (page) => {

    let p = new Promise(resolve => {
        page.on('close', () => {

            resolve(null);
            
        });
    });

    await page.close();

    await p;
}



export const terminateChromeInstances = async (browser, client, stats) => {

    await closePage(client);

    await closePage(stats);

    //TODO keep an eye on dangling process issue as puppeteer version update happens 
    //await browser.close();
    //workaround

    await closeBrowser(browser);

    await pause(100);
}