// load dyson vue store and subscribe to updates
          DysonLoader().then(() => {
            console.log("DysonLoader loaded");
          });
        
          const app = Vue.createApp({
            data() {
              return {
                result: {},
                sortedItems: [],
                newPost: "",
                newReply: "",
                accountData: null,
                currentDateTime: "",
                output: "",
                postId: "",
                isMenuActive: false,
                keplr: null,
                isConnected: false,
                sortOption: "newest",
                usernames: [],
                userData: "",
                loading: true,
                showOnlyMyPosts: false,
                resultText: "",
                showResultsBox: false,
                api: 'https://api-dys-testnet.dysonvalidator.com/dyson/storageprefix',
                showConfirmation: false,
                showDeleteReplyConfirmation: false,
                replyId: "",
                showReplies: false,
                isVisable: false,
                key: "",
                loadMoreButton: true,
                profilepage: 'dys178nsz4x7f3rew089w35cuhsfuxqwf7kc98y2tt',
                messageboard: 'dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr',
                posterData: {},
                replyData: {},
                replies: {},
                postFilterOption: 'all',
              }
            },
            
            /**
             * Fetches usernames from the server and sets them as a property on the Vue instance.
             */
            async created() {
              // Fetch data from the server
              const response = await fetch(this.api + '?' + new URLSearchParams({
                "prefix": this.profilepage + "/usernames/"
              }));
              
              // Parse the JSON response and store it to data
              const json = await response.json();
              const storage = json.storage;
              const data = JSON.parse(storage[0].data);
              
              // Set the username property from the data object
              this.usernames = data.users;
            },
            
            methods: {
              
              /**
               * Matches the username to wallet address or returns wallet address if no username found
               *
               * @param {string} address - The address to look up.
               * @returns {string} The matching username or the address if no match is found.
               */
              getUsernameFromAddress(address) {
                if (this.usernames) {
                  // Look for username in list of usernames and return username if found.
                  const match = this.usernames.find(({ user }) => user === address);
                  return match ? match.username : address;
                } else {
                  // If no match is found return address.
                  return address;
                }
              },
              
              /**
               * Gets the data from the poster data from an api to display data
               * if there is no data return null
               */
              async getDataFromAddress(address) {
                const response = await fetch(this.api + '?' + new URLSearchParams({
                  "prefix": this.profilepage + "/user/" + address
                }))
                const json = await response.json();
                if (json.storage && json.storage.length > 0 && json.storage[0].data) {
                  const posterData = JSON.parse(json.storage[0].data);
                  console.log('posterData:', posterData);
                  return posterData;
                } else {
                  return null;
                }
                console.log('current data:', this.posterData);
              },
              
              async fetchPosterData() {
                if (!this.sortedStorage || !Array.isArray(this.sortedStorage)) {
                  // Handle the case where userData.following is not defined or not an array
                  return;
                }
                for (const item of this.sortedStorage) {
                  const posterData = await this.getDataFromAddress(item.data.author);
                  if (posterData) {
                    // Set a default picture if user doesn't have one.
                    if (!posterData.profile_photo || posterData.profile_photo === '' || posterData.profile_photo === 'Empty') {
                      posterData.profile_photo = 'https://i.ibb.co/SnBmvHf/user-icon.png';
                    }
                    // Set a default footer signature if user does not have one
                      if (!posterData.about || posterData.about === '' || posterData.about === 'Empty') {
                        posterData.about = "Set a custom footer in your profile";
                      }
                  this.posterData[item.data.author] = posterData;
                  }
                  }
              },
              
              /**
               * Gets the data from the reply data from an api to display data
               * if ther is no data return null
               */
              async getReplyFromAddress(address) {
                const response = await fetch(this.api + '?' + new URLSearchParams({
                  "prefix": this.profilepage + "/user/" + address
                }))
                const json = await response.json();
                if (json.storage && json.storage.length > 0 && json.storage[0].data) {
                  const replyData = JSON.parse(json.storage[0].data);
                  console.log('replyData:', replyData);
                  return replyData;
                } else {
                  return null;
                }
                console.log('current data:', this.replyData);
              },
              
              async fetchReplyData() {
                for (const item of this.sortedStorage) {
                  if (!item.data.replies || !Array.isArray(item.data.replies)) {
                  // Handle the case where userData.following is not defined or not an array
                  return;
                }
                  for (const reply of item.data.replies) {
                    const replyData = await this.getReplyFromAddress(reply.author);
                    if (replyData) {
                    // Set a default picture if user doesn't have one.
                    if (!replyData.profile_photo || replyData.profile_photo === '' || replyData.profile_photo === 'Empty') {
                      replyData.profile_photo = 'https://i.ibb.co/SnBmvHf/user-icon.png';
                    }
                    // Set a default footer signature if user does not have one
                    if (!replyData.about || replyData.about === '' || replyData.about === 'Empty') {
                      replyData.about = "Set a custom footer in your profile";
                    }
                    
                    this.replyData[reply.author] = replyData
                  }
                }
                }
              },
              
              /**
               * Fetch data fromthe api and parse in to app
               */
              async fetchDataFromApiAndParse() {
                try {
                  const response = await fetch(
                  this.api +
                  "?" +
                  new URLSearchParams({
                    prefix: this.messageboard + "/post/",
                    "pagination.key": this.key,
                    "pagination.limit": "10",
                  })
                  );
                  const json = await response.json();
                  this.result = json;
                  
                  // Parse the data.
                  this.result.storage.forEach((item) => {
                    item.data = JSON.parse(item.data);
                  });
                  
                   // Update the key for the next page.
                  if (this.result.pagination.next_key !== this.key) {
                    this.key = this.result.pagination.next_key;
                  } else {
                    loadMoreButton = false;
                  }
                } catch(error) {
                  console.log(error);
                }
              },
              
              /**
               * Load more results and add to the bottom of existing results
               */
               async fetchMoreResults() {
                try {
                  const response = await fetch(
                  this.api +
                  "?" +
                  new URLSearchParams({
                    prefix: this.messageboard + "/post/",
                      "pagination.key": this.key,
                      "pagination.limit": "10",
                  })
                  );
                  const json = await response.json();
        
                  // Parse the data.
                  json.storage.forEach((item) => {
                    item.data = JSON.parse(item.data);
                  });
        
                  // Append the new results to the existing ones.
                  if (json.storage.length === 0) {
                    this.loadMoreButton = false;
                  } else if (json.pagination.next_key !== this.key) {
                    this.result.storage = this.result.storage.concat(json.storage);
                    // Update the key for the next page.
                    this.key = json.pagination.next_key;
                  }
                } catch (error) {
                  console.log(error);
                }
              },
              
              /**
               * Connect to keplr and retrieve account information
               */ 
              async connectAndGetDataFromKeplr() {
              // Wait 5 seconds for dyson to load
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.connectToKeplr();
                await this.getUserData();
              },
        
              
              /**
               * Get data from the api to display posts and replys.
               */
              async getData() {
                this.key = "";
                await this.fetchDataFromApiAndParse();
              },
              
              /**
               * Get user data from profile page if they have created one.
               */
              async getUserData() {
                // Fetch data from the api.
                response = await fetch(this.api + '?' + new URLSearchParams({
                "prefix": this.profilepage + "/user/" + this.accountData.bech32Address
                }))
                
                // Parse the JSON response, check it and store it.
                const json = await response.json()
                if (json.storage && json.storage.length > 0 && json.storage[0].data) {
                  const userData = JSON.parse(json.storage[0].data);
                  console.log('userData:', userData);
                  
                  // Set a default picture if user doesn't have one.
                  if (!userData.profile_photo || userData.profile_photo === '' || userData.profile_photo === 'Empty') {
                    userData.profile_photo = 'https://i.ibb.co/SnBmvHf/user-icon.png';
                  }
                  
                  // Set a default footer signature if user does not have one
                  if (!userData.about || userData.about === '' || userData.about === 'Empty') {
                    userData.about = "Set a custom footer in profile";
                  }
                  
                  // Save user data.
                  this.userData = userData;
                } else {
                  // Error if no user data found.
                  console.error('No user data found');
                }
              },
              
              /**
               * Connect to Keplr Extension if installed.
               */
              async connectToKeplr() {
                // Check that the Keplr extension is installed
                if (!window.getOfflineSigner) {
                  
                  // Display error to user
                  this.resultText = `Keplr not installed.`;
                  this.showResultsBox = true;
                  return;
                }
                
                try {
                  // Set results from dysonUseKeplr to accountData
                  const accountData = await dysonUseKeplr();
                  console.log("Keplr Ready!", accountData);
                  
                  // Save account data
                  this.accountData = accountData;
                          
                  // Run getUserData if empty
                  if (Object.keys(this.userData).length === 0) {
                    await this.getUserData();
                  }
                  
                  // Set isConnected to true and update
                  this.isConnected = true;
                } catch (e) {
                  console.log("Keplr error:", e);
                }
              },
              
              /**
               * Disconnect from keplr by setting accountData to an empty object
               */
               disconnectKeplr() {
                 this.accountData = {};
                 this.userData = {};
                 this.postFilterOption = 'all';
                 this.isConnected = false;
               },
              
              /**
               * Display normal menu or burger menu depending on screen size
               */
              toggleMenu() {
                this.isMenuActive = !this.isMenuActive;
              },
              
              /**
               * Hide results box and clear data from it.
               */
              hideResultBox() {
                this.showResultsBox = false;
                this.resultText = "";
              },
              
            /**
             * Submit a new post to the blockchain.
             */
            async submit() {
              try {
                if (!this.isConnected) {
                  // User is not connected. Show message and connect to Keplr.
                  this.resultText = `Connect your wallet to submit a post.`;
                  this.showResultsBox = true;
                  await this.connectToKeplr();
                } else {
                  if(this.newPost.length >= 20) {
                    // Check the post is more then 20 characters and post message.
                    const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                      "value": {
                        "creator": this.accountData.bech32Address,
                        "address": this.messageboard,
                        "function_name": "new_post",
                        "kwargs": JSON.stringify({ "body": this.newPost }),
                        "coins": ""
                      },
                      "fee": [{ amount: '50', denom: 'dys' }],
                      "gas": "500000"
                    });
                    
                    // Get the result of the transaction
                    const rawLogs = JSON.parse(result.rawLog);
                    const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                    console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                  
                    // Output result
                    this.resultText = `Result: ${JSON.stringify(valueObject.result)} - TX Hash: ${result.transactionHash}`;
                    this.showResultsBox = true;
                  
                    // Reload the dom and empty newPost
                    await this.getData();
                    this.newPost = "";
                  } else {
                    // Post body is too short, show an error message
                    console.log("Post must be at least 20 characters long.");
                    this.resultText = `Post must be at least 20 characters long.`;
                    this.showResultsBox = true;
                    return;
                  }
        
                }
              } catch (error) {
                  console.log(error);
                  this.resultText = `Result: ${error}`;
                  this.showResultsBox = true;
                }
            },
        
              /**
              * Submit a reply to a post
              *
              * @param {string} id - The ID of the post to reply to
              * @param {object} item - The reply data
              */
              async submitReply(id, item) {
                try {
                  if (!this.isConnected) {
                    // User not connected, show message and connect to Keplr
                    this.resultText = `Connect your wallet to reply.`;
                    this.showResultsBox = true;
                    await this.connectToKeplr();
                  } else {
                    if(item.newReply && item.newReply.length >= 6) {
                      // Check reply is at least 6 characters long and post to blockchain  
                      const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                        "value": {
                          "creator": this.accountData.bech32Address,
                          "address": this.messageboard,
                          "function_name": "add_reply",
                          "kwargs": JSON.stringify({ "body": item.newReply, "post_id": id }),
                          "coins": ""
                        },
                        "fee": [{ amount: '100', denom: 'dys' }],
                        "gas": "1000000"
                      });
                    
                      if (result.code !== 0) {
                        // transaction failed, display error message to user
                        this.resultText = `Result: ${result.rawLog} - TX Hash: ${result.transactionHash}`;
                        this.showResultsBox = true;
                        return;
                      }
                      
                      // Get the result of the transaction.
                      const rawLogs = JSON.parse(result.rawLog);
                      const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                      console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                    
                      // Output result
                      this.resultText = `Result: ${JSON.stringify(valueObject.result)} - TX Hash: ${result.transactionHash}`;
                      this.showResultsBox = true;
                    
                      // Reload the dom and empty newPost
                      await this.getData();
                      this.newReply = "";
                    } else {
                      // Reply body is too short, show an error message
                      console.log("Reply must be at least 6 characters long.");
                      this.resultText = `Reply must be at least 6 characters long.`;
                      this.showResultsBox = true;
                      return;
                    }
                    
                  }
                } catch (error) {
                  console.log(error);
                  this.resultText = `Result: ${error}`;
                  this.showResultsBox = true;
                }
              },
        
                
              /**
               * Delete a post from the blockchain storage.
               * 
               * @param {string} id - The ID of the post to delete.
               */ 
              async deletePost(id) {
                try {
                  if (!this.isConnected) {
                    // User not connected, show message and connect to Keplr
                    this.resultText = `Connect your wallet to delete a post.`;
                    this.showResultsBox = true;
                    await this.connectToKeplr();
                  } else {
                    // Delete message from storage.
                    const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                      "value": {
                        "creator": this.accountData.bech32Address,
                        "address": this.messageboard,
                        "function_name": "delete_post",
                        "kwargs": JSON.stringify({ "post_id": id }),
                        "coins": ""
                      },
                      "fee": [{ amount: '50', denom: 'dys' }], gas: "500000"
                    });
                    
                    // Get the result of the transaction
                    const rawLogs = JSON.parse(result.rawLog);
                    const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                    
                    console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                    
                    // Output result
                    this.resultText = `Result: ${JSON.stringify(valueObject.result)} - TX Hash: ${result.transactionHash}`;
                    this.showResultsBox = true;
                  
                    // Reload the dom and empty newPost
                    await this.getData();
                  }
                } catch (error) {
                  console.log(error);
                  this.resultText = `Result: ${error}`;
                  this.showResultsBox = true;
                  
                }
              },
              
              /**
               * Delete replies from posts and replace with a different body message
               * 
               * @param {string} id - The post id of the reply
               * @param {string} replyId - The reply id to delete
               */
               async deleteReply(id, replyId) {
                 try{
                   if (!this.isConnected) {
                    // User not connected, show message and connect to Keplr
                    this.resultText = `Connect your wallet to delete a reply.`;
                    this.showResultsBox = true;
                    await this.connectToKeplr();
                    } else {
                      // Delete message from storage.
                      const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                        "value": {
                          "creator": this.accountData.bech32Address,
                          "address": this.messgeboard,
                          "function_name": "delete_replies",
                          "kwargs": JSON.stringify({ "post_id": id, "reply_id": replyId }),
                          "coins": ""
                        },
                        "fee": [{ amount: '50', denom: 'dys' }], gas: "500000"
                      });
                    
                      // Get the result of the transaction
                      const rawLogs = JSON.parse(result.rawLog);
                      const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                    
                      console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                    
                      // Output result
                      this.resultText = `Result: ${JSON.stringify(valueObject.result)} - TX Hash: ${result.transactionHash}`;
                      this.showResultsBox = true;
                  
                      // Reload the dom and empty newPost
                      await this.getData();
                    }
                  } catch (error) {
                    console.log(error);
                    this.resultText = `Result: ${error}`;
                    this.showResultsBox = true;
                  }
               },
               
               /**
                * Add users to a following list
                * @param {string} address of user to follow
                */
              async followUser(address) {
                try {
                  // check the user has a profile and display error message
                  if(!this.userData || !this.userData.username){
                    this.resultText = `You need to create a profile to follow users.`;
                    this.showResultsBox = true;
                  } else {
                    const followAddress = address;
                 
                    const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                      "value": {
                        "creator": this.accountData.bech32Address,
                        "address": this.profilepage,
                        "function_name": "update_following",
                        "kwargs": JSON.stringify({
                          "address": followAddress,
                        }),
                        "coins": ""
                      },
                      "fee": [{
                        amount: '100',
                        denom: 'dys'
                      }],
                      "gas": "1000000"
                    });
                    // Get data to display messages
                    const rawLogs = JSON.parse(result.rawLog);
                    console.log(result.rawLog)
                    const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
        
                    console.log(valueObject.result);
                    console.log(`Result: ` + JSON.stringify(valueObject.stdout) + `\nTX Hash: ` + result.transactionHash);
                    this.resultText = `Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ${result.transactionHash}`;
                    this.showResultsBox = true;
                    this.getUserData();
                  }
                } catch (error) {
                    console.log(error);
                    this.resultText = `Result: ${error}`;
                    this.showResultsBox = true;
                  }
               },
               
               /**
                * Unfollow users
                * @param {string} address of user to unfollow
                */
                async unfollowUser(address) {
                  try {
                    // Check if user ha a profile and display error message
                    if(!this.userData || !this.userData.username){
                      this.resultText = `You need to log in to unfollow users.`;
                      this.showResultsBox = true;
                    } else {
                      const unfollowAddress = address;
            
                      const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                      "value": {
                        "creator": this.accountData.bech32Address,
                        "address": this.profilepage,
                        "function_name": "delete_following",
                        "kwargs": JSON.stringify({
                          "address": unfollowAddress,
                        }),
                        "coins": ""
                      },
                      "fee": [{
                        amount: '100',
                        denom: 'dys'
                      }],
                      "gas": "1000000"
                      });
                      const rawLogs = JSON.parse(result.rawLog);
                      console.log(result.rawLog)
                      const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);

                      console.log(valueObject.result);
                      console.log(`Result: ` + JSON.stringify(valueObject.stdout) + `\nTX Hash: ` + result.transactionHash);
                      this.resultText = `Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ${result.transactionHash}`;
                      this.showResultsBox = true;
                      this.getUserData();
                    }
                  } catch (error) {
                    console.log(error);
                    this.resultText = `Result: ${error}`;
                    this.showResultsBox = true;
                  }
                },
        
              
             },
            
            /**
             * Asynchronous function called when the component is mounted.
             * It sets the loading state to true and checks whether Keplr is installed or not.
             * If Keplr is installed, it fetches some data from an API, connects to Keplr after 5 seconds,
             * retrieves user data, and sets the loading state to false.
             * If Keplr is not installed, it fetches some data from an API and sets the loading state to false.
             */
            async mounted() {
              this.loading = true;
        
              // Check that keplr is installed
              if (window.getOfflineSigner) {
                await this.fetchDataFromApiAndParse();
                await this.connectAndGetDataFromKeplr();
                await this.fetchPosterData();
                await this.fetchReplyData();
              } else {
                await this.fetchDataFromApiAndParse();
                await this.fetchPosterData();
                await this.fetchReplyData();
              }
        
              this.loading = false;
            },
        
            computed: {
              /**
               * Computed property that returns the sorted storage.
               * If there are no result, it returns an empty array.
               * If showOnlyMyPosts is true and the user is logged in, it filters the storage to show only the user's posts.
               * If the filtered storage is empty, it sets the resultText and showResultsBox variables accordingly.
               * Then it sorts the storage according to the sortOption and returns it.
               */
              sortedStorage() {
                if (!this.result) {
                  return [];
                }
        
                let storage = this.result.storage;
        
                // Apply post filter based on the selected option
                if (this.postFilterOption === 'mine' && this.accountData.bech32Address) {
                  // Show only user's own posts
                  storage = storage.filter(item => item.data.author === this.accountData.bech32Address);
        
                  if (storage.length === 0) {
                    this.resultText = `You haven't posted anything yet!`;
                    this.showResultsBox = true;
                    return [];
                  }
                } else if (this.postFilterOption === 'following' && this.accountData.bech32Address && this.userData.following) {
                  // Show only posts from people the user follows
                  const followingAddresses = this.userData.following.map(obj => obj.address);
                  storage = storage.filter(item => followingAddresses.includes(item.data.author));
        
                  if (storage.length === 0) {
                    this.resultText = `No posts available from the people you follow.`;
                    this.showResultsBox = true;
                    return [];
                  }
                }
                // No filter applied for the "All" option
        
                // Switch between newest and oldest posts.
                switch (this.sortOption) {
                  case 'newest':
                    return storage.sort((a, b) => b.data.id - a.data.id);
                  case 'oldest':
                    return storage.sort((a, b) => a.data.id - b.data.id);
                  default:
                    return [];
                }
              },
        
             
              /**
               * Computed property that counts down the characters left in a new post.
               */ 
              remainingChars() {
                const maxLength = 400
                const currentLength = this.newPost.length
                const remaining = maxLength - currentLength
                return remaining
              },
              
              /**
               * Computed property that returns true if user is logged in, false otherwise.
               */ 
              isUserLoggedIn() {
                return !!this.accountData && !!this.accountData.bech32Address;
              },
              
              /**
               * Get the current year for the footer
               */
               currentYear() {
                 const now = new Date();
                 const thisYear = now.getFullYear();
                 return thisYear;
               },
              
              /**
               * Display either follow or unfollow button depending if the poster
               * is being followed by user
               * @param {string} address passed from post
               */
              isFollowingUser() {
                return function(address) {
                  if (this.userData.following && this.userData.following.length > 0) {
                    return this.userData.following.some(obj => obj.address === address);
                  }
                return false;
                };
               },
              
            },
          })
          app.mount('#app')
