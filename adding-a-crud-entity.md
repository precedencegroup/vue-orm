# Adding a crud entity to vue-orm
This commit shows a full end-to end crud model being added to laravel and exposed to vue-orm:

https://bitbucket.org/precedence/tfdc/commits/54ba05fe77455a4332faa0db8b1722e1138b52b5

In the future this will be automatically scaffolded using an artisan command but for now here are the steps.

# Copy and paste from the code blocks below

## The model - eg Product
**Generate the model files using Artisan**
You are adding a regular old Laravel model so the usual steps apply:

    php artisan make:model Product -r -m
    
This will make your migration, your resource controller and your model files for you. **You'll want to change your resource controller so that it extends our `APIController` class** instead of `Controller`, as that takes care of a couple of extra functions our ORM expects.

## Create your APIResource
Vue-orm expects some things to be available on the data it receives, so you should create a Resource class for you model, that extends our `APIResource` class:

	namespace App\Http\Resources;

	use Illuminate\Http\Resources\Json\JsonResource;

	class ProductResource extends APIResource
	{
		/**
		 * Transform the resource into an array.
		 *
		 * @param  \Illuminate\Http\Request  $request
		 * @return array
		 */
		public function toArray($request)
		{
			return [
				'id' => $this->id,
				'name' => $this->name,
				'price' => $this->price,
            	'reviews' => ReviewResource::sparseCollection($this->reviews),
			];
		}

		public static $schema = [[]];
	}
	
One of the main things our `APIResource` class includes is the `sparseCollection` method you can see above, which simply loads a relationship with dehydrated, id-only objects. The vue-orm system will link these up on the front end, so there's no need to load all of the extra data in those relationships.

## Add your vue-orm Entity file
We need to create a file for vue-orm to mount the vuex module - there is one included in this package, just copy it and change the filename/variables at the top of the file.

This code should go in `js/entities/Product/index.js`

	// import functions from the calling file in order to update the array located therein
	import {registerGeneratedStoreModule} from '../../generateStores'

	// prepare our data - we shouldn't need to edit anything in this file except the below strings
	const model_type = "Product"
	const model_name = "Product"
	const model_name_plural = "Products"
	const model_name_field = "name"
	const relationships = {
		reviews: 'Review',
	}
	// STOP EDITING! The rest is bootstrapping

	// MODEL STORE
	// import the base store, duplicate it and set the copy's state to this model
	import {StoreModulePrototype} from '../../../admin/classes/StoreModulePrototype'

	// create a local object to be our store
	const modelStore = new StoreModulePrototype();

	// update the state to make this new store our own
	modelStore.state.model = model_type
	modelStore.state.model_name = model_name
	modelStore.state.model_name_plural = model_name_plural
	modelStore.state.model_name_field = model_name_field
	modelStore.state.model_type = model_type
	modelStore.state.model_icon = model_icon
	modelStore.state.relationships = relationships

	// use our generatedStores module to register this store as a module on the root store
	registerGeneratedStoreModule(model_type, modelStore)


	export {
		model_type
	}

## Mount the entity
Finally, you need to register the entity with vue-orm. Open your `js/mountEntities.js` file and add a simple require at the bottom of the list:

	// require your artisan-generated modules here
	// their index.js files will use the functions from generateStores and generateRoutes
	// to register themselves into the system
	require('./entities/Store')
	require('./entities/User')
	require('./entities/Product')
	
## Load your new module in vue
You can now use the vue-orm crud actions in your components:

	this.$store.dispatch('Product/index')
	this.$store.dispatch('Product/show', 1)
	this.$store.dispatch('Product/store' {...object, id: 1})
	this.$store.dispatch('Product/update', {...object, id: 1})
	this.$store.dispatch('Product/destroy', 1)
	this.$store.dispatch('Product/attach', {relationship: 'reviews', [{...review}, {...review}] })
	this.$store.dispatch('Product/detach', {relationship: 'reviews', id: 45})
	this.$store.dispatch('Product/sync', {relationship: 'reviews', [32, 45]})