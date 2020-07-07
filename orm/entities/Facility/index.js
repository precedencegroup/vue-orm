// import functions from the calling file in order to update the array located therein
import {EntityStore, registerEntity} from '../../vue-orm'
// prepare our data
const model_type = "Facility"
const relationships = {
    enrolments: 'Enrolment',
    educator: 'Educator',
    children: 'Child',
}


const modelStore = new EntityStore();

modelStore.state.model = model_type
modelStore.state.relationships = relationships

// use our generatedStores module to register this store as a module on the root store
registerEntity(model_type, modelStore)
// if you want to change the name of your module, swap out model_type