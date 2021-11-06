
export const confirmVideoStreamingActive = async (client) => {

    return await client.waitFor(() => {

        const v = document.getElementsByTagName("video");

        let acc = true;

        for(let i = 0; i < v.length; i++) {
            const next = v[i];
            acc = acc && next && next.networkState == 2;
        }
        
        return acc;
        
    }, { timeout: 10000 });

}
