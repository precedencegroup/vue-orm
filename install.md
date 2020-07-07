# Installation

## Installing the files
For now, just download and extract this git repo directly into your vue project. We will add a package manager and whatever later.

Once extracted, your vue directory will probably look something like this:

    components/
    sass/
    orm/
    app.js
    store.js
    router.js
    
Note that we have created the `orm` folder now, with the contents of this repo.

Enter this directory now, it should look like this:

    entities/
        -> Facility
            -> index.js
    mountEntities.js
    vue-orm.js

The `mountEntities.js` file is crucial - you'll need to update this to let vue-orm know about your new Entities. It is kept as a separate file so that we can easily edit it using auto-generation artisan commands.

## Implementing into your Vue app
In order to expose your orm modules to vue, you simply need to spread the orm into your stores `modules` property.

First, include the generated modules into your vuex store:

store.js:

    import {EntityModules} from './orm/vue-orm'
    
Then, spread the `EntityModules` into your stores `modules` property:

    const store = new Vuex.Store({
        state: {
            /*      snip      */
        },
        mutations: {
            /*      snip      */
        },
        modules: {
            ...EntityModules
        },
        /*        etc         */
    })


## Adding an Entity
In order to create a new entity to be managed by the orm, copy the existing `Facility` directory and name it to match your model.

Then enter that directory's `index.js` and update the `model_type` field to match your models type.

Finally, open `mountEntities.js` and copy the `Facility` line and edit to match your models directory path. You can add and delete lines here to tell vue-orm what to include in its registration.

## Caveats
Vue-orm will `.toLowerCase` your `model_type` in order to assume your API routes. That means a `model_type` of `FastCar` will be assuming a GET `/api/fastcar/:id` route, for instance.

Vue-orm assumes your API routes are prepended with `/api/`, hence the full endpoint url above.

It also assumes CRUD routes that conform to Laravels resource controllers. Meaning the following:


|Verb	   |URI	                 |Action   |Route Name       |
|----------|:-------------------:|:-------:|----------------:|
|GET	   |/photos	             |index	   |photos.index     |
|GET	   |/photos/create       |create   |photos.create    |
|POST	   |/photos	             |store	   |photos.store     |
|GET	   |/photos/{photo}	     |show	   |photos.show      |
|GET	   |/photos/{photo}/edit |edit	   |photos.edit      |
|PUT/PATCH |/photos/{photo}	     |update   |photos.update    |
|DELETE	   |/photos/{photo}	     |destroy  |photos.destroy   |

Luckily, that means that if you are using laravel you can simply assign a resource controller to a route monitored by vue-orm and your work is done here.