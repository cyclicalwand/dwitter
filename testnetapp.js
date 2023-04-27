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
                  }
                },
                
                /**
                 * Fetches usernames from the server and sets them as a property on the Vue instance.
                 */
                async created() {
                  // Fetch data from the server
                  const response = await fetch(this.api + '?' + new URLSearchParams({
                    "prefix": "dys178nsz4x7f3rew089w35cuhsfuxqwf7kc98y2tt/usernames/"
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
                      // Look for username in list of usernames and return username if fouund.
                      const match = this.usernames.find(({ user }) => user === address);
                      return match ? match.username : address;
                    } else {
                      // If no match is found return address.
                      return address;
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
                        prefix: "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr/post/",
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
                        prefix: "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr/post/",
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
                    "prefix": "dys178nsz4x7f3rew089w35cuhsfuxqwf7kc98y2tt/user/" + this.accountData.bech32Address
                    }))
                    
                    // Parse the JSON response, check it and store it.
                    const json = await response.json()
                    if (json.storage && json.storage.length > 0 && json.storage[0].data) {
                      const userData = JSON.parse(json.storage[0].data);
                      console.log('userData:', userData);
                      
                      // Set a default picture if user doesn't have one.
                      if (userData.profile_photo === '' || userData.profile_photo === 'Empty') {
                        userData.profile_photo = 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/query-what-how-why-icon.svg';
                      }
                      
                      // Save user data.
                      this.userData = userData;
                    } else {
                      // Error if no user data found.
                      console.error('No user data found');
                    }
                  },
                  
                  /**
                   * Connect to Keple Extension if installed.
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
                      
                      // Set isConnected to true and updtae
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
                            "address": "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr",
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
                              "address": "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr",
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
                            "address": "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr", // your script
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
                              "address": "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr", // your script
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
                  } else {
                    await this.fetchDataFromApiAndParse();
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
                    let storage = this.result.storage
                    
                    // Show only users posts
                    if(this.showOnlyMyPosts && this.accountData.bech32Address) {
                      storage = storage.filter(item => item.data.author === this.accountData.bech32Address);
                      if (storage.length === 0) {
                        this.resultText = `You haven't posted anything yet!.`;
                        this.showResultsBox = true;
                        return [];
                      }
                    }
                    
                    // Switch between newest and oldest posts.
                    switch(this.sortOption) {
                      case "newest":
                        return storage.sort((a, b)=> b.data.id - a.data.id);
                      case "oldest":
                        return storage.sort((a, b)=> a.data.id - b.data.id);
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
                  
                },
              })
              app.mount('#app')
