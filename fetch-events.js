
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    const rpc = process.env.RPC_URL;
    if (!apiKey || !rpc) {
      return res.status(500).json({ error: "Server misconfigured: secrets missing." });
    }
    const contractAddress = "0xc7fCFeEc5FB9962bDC2234A7a25dCec739e27f9f";
    const startBlock = 260730;
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    const resp = await fetch(rpc, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
      }),
    });
    const { result: latestBlockHex } = await resp.json();
    const endBlock = parseInt(latestBlockHex, 16);
    let page = 1, allLogs = [], done = false;
    while (!done) {
      const url = `https://api-hoodi.etherscan.io/api?module=logs&action=getLogs&address=${contractAddress}&fromBlock=${startBlock}&toBlock=${endBlock}&page=${page}&offset=1000&apikey=${apiKey}`;
      const data = await fetch(url).then(res => res.json());
      if (data.status !== "1" && data.message !== "No records found") break;
      if (!data.result.length) break;
      allLogs = allLogs.concat(data.result);
      if (data.result.length < 1000) done = true;
      page++;
    }
    res.status(200).json({ logs: allLogs, endBlock });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
