/**
 * This file holds the base CRUD store module that we will extend on when generating CRUD pages.
 * 
 * This object will be copied, assigned and then passed to "new Vuex.Store()" to create the submodule at runtime
 */

import Vue from 'vue'

module.exports.EntityStore = class {

    constructor(){
        this.namespaced = true;
    
        this.state = {
            model_type: 'Base',
            local_model_class: null,
            items: [],
            modelSchema: null,
            requestTimes: {},
            hasLoaded: false
        }

        this.getters = {

            item: (state) => (id) => {
                id = parseInt(id)
                return state.items.find( item => item.id == id ) ?? []
            },

            relationships: (state, getters, rootState) => (params) => {
                /**
                 * Fetches the relationship data for the given params. Use this when accessing relationships
                 * as it will return the actual linked data from other store modules.
                 * {
                 *      parent_id: 68,
                 *      relationship: "children"
                 * }
                 */
                if( ! params.parent_id ) return []
                    // throw "No parent_id passed to getter.relationships - please pass a parent_id in the params object"
                if( ! params.relationship ) return []
                    // throw "No relationship name passed to getter.relationships - please pass a relationship name in the params object"

                var parent = state.items.find(element => element.id == params.parent_id)
                if( !parent ) return []
                    // throw "No parent item found when searching for relationship data! You may need to fetch or index first"
                if( !parent[params.relationship] ) // there is no data for that relationship on the parent item
                    return [];
                
                // Loop through the relationship and return the linked models from the respective store module
                // This relies on the relationships being declared in the entities index.js, which get injected
                // into the StoreModuleProtoypes state
                if( !state.relationships[params.relationship] ) return []
                    // throw "Relationship " + params.relationship + " has not been declared on the store module - make sure to define your relationships in the entities/[enity]/index.js file"

                var otherModule = state.relationships[params.relationship]
                var relatedItems = [];
                // honestly I could write this all with Array.map().filter().reduce().jiggle().sniff().lick().backflip().invest().detonate().purchase().convert().ace().print().buyit().useit().breakit().fixit().trashit().changeit().mail().upgradeit()
                // but it's so much easier with two for loops
                for( var i = 0; i < rootState[otherModule].items.length; i ++ ){
                    var c = rootState[otherModule].items[i];
                    
                    for( var ii = 0; ii < parent[params.relationship].length; ii ++ ){
                        var cc = parent[params.relationship][ii];
                        
                        if( c.id == cc.id ) relatedItems.push(c);
                    }
                }

                return relatedItems;
                
            },

            APICRUDRoutes: state => {
                return {
                    index: {
                        uri: '/api/'+state.model_type.toLowerCase(),
                        method: 'GET'
                    },
                    store: {
                        uri: '/api/'+state.model_type.toLowerCase(),
                        method: 'POST'
                    },
                    show: id => {
                        return {
                            uri: '/api/'+state.model_type.toLowerCase()+'/'+id,
                            method: 'GET'
                        }
                    },
                    update: id => {
                        return {
                            uri: '/api/'+state.model_type.toLowerCase()+'/'+id,
                            method: 'PUT'
                        }
                    },
                    destroy: id => {
                        return {
                            uri: '/api/'+state.model_type.toLowerCase()+'/'+id,
                            method: 'DELETE'
                        }
                    },
                    schema: {
                        uri: '/api/'+state.model_type.toLowerCase()+'/schema',
                        method: 'GET'
                    },
                    attach: {
                        uri: '/api/relationships/attach',
                        method: 'POST'
                    },
                    detach: {
                        uri: '/api/relationships/detach',
                        method: 'POST'
                    },
                    sync: {
                        uri: '/api/relationships/sync',
                        method: 'POST'
                    },
                    // We are using Spaties medialibrary which enforces a particular "relationship" style for its
                    // mediacollections. These are universal enough across all models that they might as well
                    // have their own endpoints in the store prototype
                    addMedia: {
                        uri: '/api/files/add',
                        method: 'POST'
                    },
                    removeMedia: {
                        uri: '/api/files/remove',
                        method: 'POST'
                    },
                    reorderMedia: {
                        uri: '/api/files/reorder',
                        method: 'POST'
                    }
                }
            }
        }
        
        this.actions = {
            index({state, getters, commit}) {
                return new Promise((resolve, reject) => {

                    // naively debounce this call by 50 ms
                    if( state.requestTimes['index'] && Date.now() - this.state.requestTimes['index'] > 50 ){
                        console.log('debounce!')
                        resolve(  )
                    }

                    axios.get(getters.APICRUDRoutes.index.uri).then(
                        (success) => {
                            commit('updateAllItems', success.data.data)
                            commit('setHasLoaded', true)
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error)) // globally handle errors?

                })
            },

            store({getters, commit}, item) {
                return new Promise((resolve, reject) => {
                    axios.post(getters.APICRUDRoutes.store.uri, item).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            show({getters, commit}, id) {
                return new Promise((resolve, reject) => {
                    axios.get(getters.APICRUDRoutes.show(id).uri).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve(success)
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            update({getters, commit}, model) {
                return new Promise((resolve, reject) => {
                    axios.put(getters.APICRUDRoutes.update(model.id).uri, model).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve(success)
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            destroy({getters, commit}, id) {
                return new Promise((resolve, reject) => {
                    axios.delete(getters.APICRUDRoutes.destroy(id).uri).then(
                        (success) => {
                            commit('removeItem', id)
                            resolve(success)
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            schema({getters, commit, state}){
                return new Promise((resolve, reject) => {

                    if( ! state.modelSchema ) { // schema has not been fetched yet

                        axios.get(getters.APICRUDRoutes.schema.uri).then(
                            (success) => {
                                commit('updateSchema', success.data.data)
                                resolve( success )
                            },
                            (failure) => {
                                reject(failure)
                            }
                        ).catch((error) => reject(error))

                    } else { // don't fetch schema if it has been fetched already
                        resolve()
                    }
                })
            },
            
            attach({getters, commit}, data){
                return new Promise((resolve, reject) => {
                    axios.post(getters.APICRUDRoutes.attach.uri, data).then(
                        (success) => {
                            commit('updateItemRelationship', {
								data: success.data.data,
								relationship: data.relationship
							})
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },
            
            detach({getters, commit}, data){
                return new Promise((resolve, reject) => {
                    axios.post(getters.APICRUDRoutes.detach.uri, data).then(
                        (success) => {
                            commit('updateItemRelationship', {
								data: success.data.data,
								relationship: data.relationship
							})
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },
            
            sync({getters, commit}, data){
                return new Promise((resolve, reject) => {
                    axios.post(getters.APICRUDRoutes.sync.uri, data).then(
                        (success) => {
                            commit('updateItemRelationship', {
								data: success.data.data,
								relationship: data.relationship
							})
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            addMedia({getters, commit}, data){
                return new Promise((resolve, reject) => {
                    var fd = new FormData();
                    // append the file to FormData
                    fd.append('file', data.file); 
                    // gather data on the model and mediacollection so we can assign it properly on the server
                    fd.append('model_type', data.model_type);
                    fd.append('model_id', data.model_id);
                    fd.append('media_collection', data.media_collection);
                    // send it off
                    axios.post(
                        getters.APICRUDRoutes.addMedia.uri,
                        fd,
                        { headers: {'content-type': 'multipart/form-data'}}
                    ).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            removeMedia({getters, commit}, data){
                return new Promise((resolve, reject) => {
                    var fd = new FormData();
                    // append the file to FormData
                    fd.append('file_id', data.file_id); 
                    // gather data on the model and mediacollection so we can assign it properly on the server
                    fd.append('model_type', data.model_type);
                    fd.append('model_id', data.model_id);
                    fd.append('media_collection', data.media_collection);
                    // send it off
                    axios.post(
                        getters.APICRUDRoutes.removeMedia.uri,
                        fd,
                        { headers: {'content-type': 'multipart/form-data'}}
                    ).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })
            },

            reorderMedia({getters}, data){
                // send off a flat list of media item ids that will update the DB order
                return new Promise((resolve, reject) => {
                    axios.post(
                        getters.APICRUDRoutes.reorderMedia.uri,
                        {
                            model_type: data.model_type,
                            model_id: data.model_id,
                            media_collection: data.media_collection,
                            file_order: data.file_order,
                        },
                    ).then(
                        (success) => {
                            commit('updateItem', success.data.data)
                            resolve( success )
                        },
                        (failure) => {
                            reject(failure)
                        }
                    ).catch((error) => reject(error))
                })

            },
        }

        this.mutations = {
            updateAllItems( state, items ){
				Vue.set(state, 'items', items)
				this._vm.$forceUpdate()
            },

            // find the local version of the passed item and update it
            // if no local copy exists, create it with the passed values
            updateItem( state, item ){
                // find the local copy
                var staleItem = state.items.find(entry => entry.id == item.id);
                
				if( !staleItem ) { // no local object found, create it
                    var items = JSON.parse(JSON.stringify(state.items))
                    items.push(item)
					Vue.set(state, 'items', items)
                } else {
                    state.items.map( (element, index) => {
                        if( element.id == item.id ) Vue.set(state.items, index, item)
                    })
                }
            },

			// update only the relationship ids for the given relationship
			// this is to avoid overwriting local data when updating relationships
            updateItemRelationship( state, data ){
                // find the local copy
                var staleItem = state.items.find(entry => entry.id == data.data.id);
				// update the given relationship
				staleItem[data.relationship] = data.data[data.relationship]
				// use Vue.set for reactivity
				Vue.set(state.items, state.items.indexOf(staleItem), staleItem)
            },

            removeItem( state, id ){
                var items = JSON.parse(JSON.stringify(state.items))
                var item = items.find( element => element.id == id )
                items.splice(items.indexOf(item), 1)
                Vue.set(state, 'items', items)

            },
            
            updateSchema( state, schema ){
                state.modelSchema = schema;
            },

            setHasLoaded( state, loaded ){
				state.hasLoaded = loaded
				this._vm.$forceUpdate()
            }

        }
    }
}


// this object will be spread into the modules property of the root store
module.exports.EntityModules = {}
// allow other files to push to the EntityModules object
module.exports.registerEntity = function(moduleName, storeModule){
    module.exports.EntityModules[moduleName] = storeModule
}
require('./mountEntities')