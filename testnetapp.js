// load dyson vue store and subscribe to updates
              DysonLoader().then(() => {
                console.log("DysonLoader loaded");
              });
      
              const app = Vue.createApp({
                data() {
                  return {
                    result: null,
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
                    api: 'https://api-dys-testnet.dysonvalidator.com/dyson/storageprefix',
                  }
                },
                async created() {
                  const response = await fetch(this.api + '?' + new URLSearchParams({
                    "prefix": "dys178nsz4x7f3rew089w35cuhsfuxqwf7kc98y2tt/usernames/"
                  }));
                  const json = await response.json();
                  const storage = json.storage;
                  const data = JSON.parse(storage[0].data);
                  this.usernames = data.users;
                },
                methods: {
                  getUsernameFromAddress(address) {
                    if (this.usernames) {
                      const match = this.usernames.find(({ user }) => user === address);
                      return match ? match.username : address;
                    } else {
                      return address;
                    }
                  },
                  
                  async getUserData() {
                    response = await fetch(this.api + '?' + new URLSearchParams({
                    "prefix": "dys178nsz4x7f3rew089w35cuhsfuxqwf7kc98y2tt/user/" + this.accountData.bech32Address
                    }))
                    const json = await response.json()
                    if (json.storage && json.storage.length > 0 && json.storage[0].data) {
                      const userData = JSON.parse(json.storage[0].data);
                      console.log('userData:', userData);
                      if (userData.profile_photo === '' || userData.profile_photo === 'Empty') {
                        userData.profile_photo = 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/query-what-how-why-icon.svg';
                      }
                      this.userData = userData;
                    } else {
                      console.error('No user data found');
                    }
                  },
                  
                  async connectToKeplr() {
                    // Check that the Keplr extension is installed
                    if (!window.getOfflineSigner) {
                      alert("Please install the Keplr extension to use this feature.");
                      return;
                    }
                    
                    try {
                      const accountData = await dysonUseKeplr();
                      console.log("Keplr Ready!", accountData);
                      this.accountData = accountData;
                      this.isConnected = true;
                    } catch (e) {
                      console.log("Keplr error:", e);
                    }
                  },
                  
                  toggleMenu() {
                    this.isMenuActive = !this.isMenuActive;
                  },
                  
                async submit() {
                  try {
                    if (!this.accountData) {
                      alert("Please connect your wallet to submit a post.");
                      await this.connectToKeplr();
                    } else {
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

                      const rawLogs = JSON.parse(result.rawLog);
                      const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                      console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                      alert(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ${result.transactionHash}`);
                      location.reload();
                    }
                  } catch (error) {
                      console.log(error);
                      alert(`Submit error: ${error.message}`);
                    }
                },

                  
                  async submitReply(id, item) {
                    try {
                      if (!this.accountData) {
                        alert("Please connect your wallet to submit a reply.");
                        await this.connectToKeplr();
                      } else {
                        const result = await dysonVueStore.dispatch("dyson/sendMsgRun", {
                            "value": {
                              "creator": this.accountData.bech32Address,
                              "address": "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr",
                              "function_name": "add_reply",
                              "kwargs": JSON.stringify({ "body": item.newReply, "post_id": id }),
                              "coins": ""
                            },
                            "fee": [{ amount: '50', denom: 'dys' }],
                            "gas": "500000"
                        });

                        const rawLogs = JSON.parse(result.rawLog);
                        const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                        
                        console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                        alert(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ${result.transactionHash}`);
                        
                        location.reload();
                      }
                    } catch (error) {
                      console.log(error);
                      alert(`Reply error: ${error.message}`);
                    }
                  },

                    
                  
                  async deletePost(id) {
                    
                    try {
                      if (this.accountData == null) {
                        alert("Connecting your wallet. Try to delete your post again once connected.");
                        await this.connectToKeplr();
                      } else {
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
                        
                        const rawLogs = JSON.parse(result.rawLog);
                        const valueObject = JSON.parse(rawLogs[0].events[1].attributes[0].value);
                        
                        console.log(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ` + result.transactionHash);
                        alert(`Result: ` + JSON.stringify(valueObject.result) + `\nTX Hash: ${result.transactionHash}`);
                        
                        
                        location.reload();
                      }
                    } catch (error) {
                      console.log(error);
                      alert(`Delete error: ${error.message}`);
                    }
                  },

                  
                 },
                
                async mounted() {
                  
                  this.loading = true;
                  
                  // Check that kelpr is installed
                  if (window.getOfflineSigner) {
                    try {
                      const response = await fetch(
                        this.api +
                        "?" +
                        new URLSearchParams({
                          prefix: "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr/post/",
                        })
                      );
                      const json = await response.json();
                      this.result = json;
                      this.result.storage.forEach((item) => {
                        item.data = JSON.parse(item.data);
                      });
                  
                      // connect to keplr after 5 seconds to give dyson chance to load
                      setTimeout(async () => {
                        await this.connectToKeplr();
                        await this.getUserData();
                        this.loading = false;
                      }, 5000);
                    } catch(error) {
                      console.log(error)
                    }
                  } else {
                    // Run when keplr is not installed
                    try {
                      const response = await fetch(
                      this.api +
                      "?" +
                      new URLSearchParams({
                        prefix: "dys1c2t867e7x33jw8c8mrl6cdvn89934k82tjvnqr/post/",
                      })
                      );
                      const json = await response.json();
                      this.result = json;
                      this.result.storage.forEach((item) => {
                        item.data = JSON.parse(item.data);
                      });
                      this.loading = false;
                    } catch(error) {
                      console.log(error)
                    }
                  }
                },
                
                computed: {
                  sortedStorage() {
                    if (!this.result) {
                      return [];
                    }
                    let storage = this.result.storage
                    
                    // Show only users posts
                    if(this.showOnlyMyPosts && this.accountData.bech32Address) {
                      storage = storage.filter(item => item.data.author === this.accountData.bech32Address);
                      if (storage.length === 0) {
                        return [{ data: { body: "You haven't posted anything yet!" } }];
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
                 
                  remainingChars() {
                    const maxLength = 400
                    const currentLength = this.newPost.length
                    const remaining = maxLength - currentLength
                    return remaining
                  },
                  
                  isUserLoggedIn() {
                    // Disable showOnlyMyPost button
                    return !!this.accountData && !!this.accountData.bech32Address;
                  },
                  
                },
              })
              app.mount('#app')
