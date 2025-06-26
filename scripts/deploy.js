const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("Starting AutoMintInvoice deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    throw new Error("No deployer account found. Please check your PRIVATE_KEY in .env file");
  }
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get the contract factory
  const AutoMintInvoice = await ethers.getContractFactory("AutoMintInvoice");
  
  // Deploy the contract
  console.log("Deploying AutoMintInvoice...");
  const autoMintInvoice = await AutoMintInvoice.deploy();
  
  // Wait for deployment to be mined
  await autoMintInvoice.waitForDeployment();
  
  const contractAddress = await autoMintInvoice.getAddress();
  console.log("AutoMintInvoice deployed to:", contractAddress);

  // Verify deployment by checking some basic contract state
  const nextInvoiceId = await autoMintInvoice.nextInvoiceId();
  const platformFeeBps = await autoMintInvoice.PLATFORM_FEE_BPS();
  
  console.log("Next Invoice ID:", nextInvoiceId.toString());
  console.log("Platform Fee (BPS):", platformFeeBps.toString());
  console.log("Owner:", await autoMintInvoice.owner());

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", (await deployer.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("========================\n");

  // Save deployment info to a file for frontend use
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    networkName: (await deployer.provider.getNetwork()).name,
    chainId: Number((await deployer.provider.getNetwork()).chainId),
    deploymentTime: new Date().toISOString(),
    contractName: "AutoMintInvoice"
  };

  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const networkName = (await deployer.provider.getNetwork()).name === "unknown" ? "sepolia" : (await deployer.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentFile);

  return contractAddress;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((contractAddress) => {
    console.log("Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
