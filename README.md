# VUE-ORM #

Vue-orm is an attempt at making the Vuex store an easy-to-use Object Relational Map.

Vuex doesn't like deeply-nested data. It leads to all kinds of nasty reactivity hacks and convoluted queries. Vue-orm flattens the data out similarly to a database table, using dynamic registration of Vuex store modules.

The system is designed to conform to a Laravel-esque resource controller CRUD pattern, and tries to respect the relationships that you would normally associate in Laravel.

I'll be using Laravel terminology, as at the moment this is heavily shackled to Laravel.

> #### please note
> At this stage vue-orm sets up a bare-base module system on top of which you can write your computed queries (more below). There are a couple of helper features in the mix, eventually I would like this to be a very smooth-using library, but for now just write your queries on top of the Module structure. Read the 'Usage' section below for example computed queries.

## Using CRUD routes
The `EntityModule` class gives us a promise-based system to interact with our API resources. Every call to any endpoint will immediately update the local modules state when the promise returns. This keeps the reactivity vibes going strong.

You can also `then(success(), failure())` the below calls. API responses are passed right up in accordance with axios - 2xx will call the `success` callback, all others will call the `failure` callback.

### Index

		this.$store.dispatch('ModelType/index')

The index call will update the modules `items` array once returned. It does not attempt to merge or append - it deletes the old array and completely resets it. An index call is only used when you want to sweepingly update the apps state. You should use the server-side controllers to decide exactly what data should be returned - using the users session or other server-side logic for data masking.


### Store

		this.$store.dispatch('ModelType/store', {
			id: 35,
			...data
		})

The `store` action requires data to POST to the server.

In order to create a new, blank object, we have our controllers set up to accept a `_placeholder` argument, which will create a new blank record on the database and softdelete it.


		this.$store.dispatch('ModelType/store', {
			_placeholder: true
		})

In both cases, vue-orm will automatically update the local module store as well.

### Show

		this.$store.dispatch('ModelType/show', {
			id: 35
		})

Very similar to store, show simply requires the model ID.

### Update 

		this.$store.dispatch('ModelType/update', {
			id: 35,
			...data
		})

When updating an existing record, all that is required is the models `id`. You can decide on your controllers what data to require on the server side. Errors are handled via an axios interceptor.

### Delete

		this.$store.dispatch('ModelType/delete', {
			id: 35
		})

The Delete call also only requires an ID.

## Usage

### Computed Properties

Since the modules are loading flat data, computed properties become easier to write:

		props: [
			'company_id'
		],
		computed: {
			company(){
				return this.$store.state.Company.items.find(
					company => company.id == this.$props.company_id
				)
			},
			products(){
				return this.$store.state.Product.items.filter(
					product => this.company.products.some(
						item => product.id == item.id
					)
				)
			}
		}

These computed properties will be very reactive due to the flat module structure.

**NOTE!** Always return an array from any computed property that might list items! A value of `null` will cause the whole thing to come flopping down, but an empty array `[]` will fit in quite nicely - as all of the array methods will simply operate on an empty array, which cascades through the system.

There is also a helper function in the local module `getters` that will fetch an item by id:

		this.$store.getters['ModelType/item'](id)

### Linking Objects

Our API has a controller that manages attaching and detaching relationships. You can link objects to one another using the below syntax:

		this.$store.dispatch('Company/attach', {
			modelType: 'Product',
			id: company.id,
			relationship: 'products',
			attachId: product.id,
		})
				
Be sure to pass the relationship name, as the controller will use this to create the attachment. It is up to you to know which models have which relationships defined.

As usual, this will update the local module once the xhr call returns, which will allow your neatly written computed properties to react accordingly.

You can also detach using the exact syntax as above, but using `this.$store.dispatch('ModelName/detach', {options})`.

There are some helper functions for relationships but they're not entirely concrete yet so probably best to ignore them.

## Example component

Here's an example component for illustration:
		
```vue
		<template>
			<div>
				<h1>{{ observation.id }}: {{ observation.name }}</h1>

				<form @submit.prevent="updateObservation">
					<input v-model="observation.name" />

					<button type="submit">
						Save
					</button>

					<button type="button" @click="deleteObservation">
						Delete
					</button>
				</form>
			</div>
		</template>

		<script>
```
```javascript

			export default {
				data() {
					return {

					}
				},

				computed: {
					// retrieving a model is as simple as searching in the modules 'items' array
					observation() {
						return this.$store.state.Observation.items.find(
							observation => observation.id == this.$route.params.id
						) ?? {} // avoid returning null or undefined!
					},

					// getting related records manually
					letters() {
						return this.$store.state.LearningLetter.items.filter(
							letter => this.observation.learning_letters.some(
								observationLetter => observationLetter.id == letter.id
							)
						)
					},
				},

				methods: {
					updateObservation() {
						// the local model will be updated automatically when the call returns
						this.$store.dispatch('Observation/update', this.observation)
					},

					deleteObservation() {
						// crud routes also return a promise!
						this.$store.dispatch('Observation/destroy', this.observation.id).then(
							success => {
								this.$router.push({
									name: 'Home'
								})
							}
						)
					},
				},
			}
```

```vue
		</script>
```

## API Requirements

As you can see from the query structure above, a `Model` is expected to have sub-arrays for its relationships. The only thing vue-orm requires is that these are arrays of objects that conform to this layout:

		Company: {
			name: "Awesome LLC",
			address: "Hollywood Blvd",
			products: [
				{ id: 1 },
				{ id: 24 },
				{ id: 345 },
				{ id: 123512 }
			]
		}

You can send down whatever other data you like in those relationship arrays, vue-orm only looks at the `id` property.

## System Flow

Vue-orm renames the Laravel concept of a `Model` to the term `Entitiy`. `Entities` are each assigned their own store module. You can see the code for exactly how that module looks and works in `vue-orm.js` - in the `EntityModule` class.

When Vue-orm fires up, it looks in the file `mountEntities.js` to find all of the entities it should register. That file is simply a list of `include('path/to/entity')` calls.

The entities live in the `Entity` folder, each in their own folder, named after their `Model` class name. For instance:

        /
		  ->Entities
		      ->Company
			  ->Product
			  ->Customer

Each entity folder contains an `index.js` file, which is what the `require` calls load on spin-up:

        /
		  ->Entities
		      ->Company
			    ->index.js
			  ->Product
			    ->index.js
			  ->Customer
			    ->index.js

These entity registration files load up the `EntityModule` class - which creates a new store module - and then add themselves to the root store with their `Model` name as the name of the module:

        store: {
		    modules: {
			    Company: 
					state: {
						model_name: 'Company',
						model_type: 'Company',
						items: [
							*Array of items*
						]
					}
				},
			    Product: 
					state: {
						model_name: 'Product',
						model_type: 'Product',
						items: [
							*Array of items*
						]
					}
				},
				etc...
			}
		}

We also have some fancy Artisan commands in the mix for scaffolding this all out automatically.
