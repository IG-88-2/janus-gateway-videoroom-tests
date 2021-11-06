export const waitUntil = async (f, timeout, defaultInterval?) => {

    let interval = defaultInterval || 1000;
  
    let time = 0;
  
    const w = async (resolve, reject) => {
  
        let done = false; 
      
        try {
            
            done = await f(time);
    
        } catch(e) {

        }
  
        if (done) {

            resolve();

        } else if(timeout && time > timeout) {
            
            const error = new Error('waitUntil - timeout');

            reject(error); 

        } else {
        
            time += interval;
    
            setTimeout(() => w(resolve, reject), interval); 
        
        }
  
    };
  
    return new Promise(w);
  
};
