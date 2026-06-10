
/*
Embedded 3D Dice Roller library from uploaded dice-main zip.
The MIT License

Copyright © 2022 dice authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
"use strict";

/**
 * @brief generates polyhedral dice with roll animation and result calculation
 * @author Anton Natarov aka Teal (original author)
 * @author Sarah Rosanna Busch (refactor, see changelog)
 * @date 10 Aug 2023
 * @version 1.1
 * @dependencies teal.js, cannon.js, three.js
 */

/**
 * CHANGELOG
 * - tweaked scaling to make dice look nice on mobile
 * - removed dice selector feature (separating UI from dice roller)
 * - file reorg (moving variable declarations to top, followed by public then private functions)
 * - removing true random option (was cool but not worth the extra dependencies or complexity)
 * - removing mouse event bindings (separating UI from dice roller)
 * - refactoring to module pattern and reducing publically available properties/methods
 * - removing dice notation getter callback in favour of setting dice to roll directly
 * - adding sound effect
 * - adding roll results to notation returned in after_roll callback
 * - adding 'd9' option (d10 to be added to d100 properly)
 */

var DICE = window.DICE = (function() {
    var that = {};

    var vars = { //todo: make these configurable on init
        frame_rate: 1 / 60,
        scale: 100, //dice size
        
        material_options: {
            specular: 0x172022,
            color: 0xf0f0f0,
            shininess: 40,
            shading: THREE.FlatShading,
        },
        label_color: '#aaaaaa', //numbers on dice
        dice_color: '#202020',
        ambient_light_color: 0xf0f0f0,
        spot_light_color: 0xefefef,
        desk_color: '#101010', //canvas background
        desk_opacity: 0.5,
        use_shadows: true,
        use_adapvite_timestep: true //todo: setting this to false improves performace a lot. but the dice rolls don't look as natural...

    }

    const CONSTS = {
        known_types: ['d4', 'd6', 'd8', 'd9', 'd10', 'd12', 'd20', 'd100'],
        dice_face_range: { 'd4': [1, 4], 'd6': [1, 6], 'd8': [1, 8], 'd9': [0, 9], 'd10': [0, 9], 
            'd12': [1, 12], 'd20': [1, 20], 'd100': [0, 9] },
        dice_mass: { 'd4': 300, 'd6': 300, 'd8': 340, 'd9': 350, 'd10': 350, 'd12': 350, 'd20': 400, 'd100': 350 },
        dice_inertia: { 'd4': 5, 'd6': 13, 'd8': 10, 'd9': 9, 'd10': 9, 'd12': 8, 'd20': 6, 'd100': 9 },
        
        standart_d20_dice_face_labels: [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8',
                '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
        standart_d100_dice_face_labels: [' ', '00', '10', '20', '30', '40', '50',
                '60', '70', '80', '90'],
                
        d4_labels: [
            [[], [0, 0, 0], [2, 4, 3], [1, 3, 4], [2, 1, 4], [1, 2, 3]],
            [[], [0, 0, 0], [2, 3, 4], [3, 1, 4], [2, 4, 1], [3, 2, 1]],
            [[], [0, 0, 0], [4, 3, 2], [3, 4, 1], [4, 2, 1], [3, 1, 2]],
            [[], [0, 0, 0], [4, 2, 3], [1, 4, 3], [4, 1, 2], [1, 3, 2]]
        ]
    }

    // DICE BOX OBJECT

    // @brief constructor; create a new instance of this to initialize the canvas
    // @param container element to contain canvas; canvas will fill container
    that.dice_box = function(container) {
        this.dices = [];
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.diceToRoll = ''; //user input
        this.container = container;

        this.renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ antialias: true, alpha: true })
            : new THREE.CanvasRenderer({ antialias: true, alpha: true });
        container.appendChild(this.renderer.domElement);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setClearColor(0xffffff, 0); //color, alpha

        this.reinit(container);
        $t.bind(container, 'resize', function() {
            //todo: this doesn't work :(
            this.reinit(elem.canvas);
        });

        this.world.gravity.set(0, 0, -9.8 * 800);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 16;

        var ambientLight = new THREE.AmbientLight(vars.ambient_light_color);
        this.scene.add(ambientLight);

        this.dice_body_material = new CANNON.Material();
        var desk_body_material = new CANNON.Material();
        var barrier_body_material = new CANNON.Material();
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    desk_body_material, this.dice_body_material, 0.01, 0.5));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    barrier_body_material, this.dice_body_material, 0, 1.0));
        this.world.addContactMaterial(new CANNON.ContactMaterial(
                    this.dice_body_material, this.dice_body_material, 0, 0.5));

        this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material));
        var barrier;
        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        barrier.position.set(0, this.h * 0.93, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        barrier.position.set(0, -this.h * 0.93, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
        barrier.position.set(this.w * 0.93, 0, 0);
        this.world.add(barrier);

        barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
        barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
        barrier.position.set(-this.w * 0.93, 0, 0);
        this.world.add(barrier);

        this.last_time = 0;
        this.running = false;

        this.renderer.render(this.scene, this.camera);
    }

    // called on init and window resize
    that.dice_box.prototype.reinit = function(container) {
        this.cw = container.clientWidth / 2;
        this.ch = container.clientHeight / 2;
        this.w = this.cw;
        this.h = this.ch;
        this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
        vars.scale = Math.sqrt(this.w * this.w + this.h * this.h) / 8;
        //console.log('scale = ' + vars.scale);

        this.renderer.setSize(this.cw * 2, this.ch * 2);

        this.wh = this.ch / this.aspect / Math.tan(10 * Math.PI / 180);
        if (this.camera) this.scene.remove(this.camera);
        this.camera = new THREE.PerspectiveCamera(20, this.cw / this.ch, 1, this.wh * 1.3);
        this.camera.position.z = this.wh;

        var mw = Math.max(this.w, this.h);
        if (this.light) this.scene.remove(this.light);
        this.light = new THREE.SpotLight(vars.spot_light_color, 2.0);
        this.light.position.set(-mw / 2, mw / 2, mw * 2);
        this.light.target.position.set(0, 0, 0);
        this.light.distance = mw * 5;
        this.light.castShadow = true;
        this.light.shadowCameraNear = mw / 10;
        this.light.shadowCameraFar = mw * 5;
        this.light.shadowCameraFov = 50;
        this.light.shadowBias = 0.001;
        this.light.shadowDarkness = 1.1;
        this.light.shadowMapWidth = 1024;
        this.light.shadowMapHeight = 1024;
        this.scene.add(this.light);

        if (this.desk) this.scene.remove(this.desk);
        this.desk = new THREE.Mesh(new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1), 
                new THREE.MeshPhongMaterial({ color: vars.desk_color, opacity: vars.desk_opacity, transparent: true }));
        this.desk.receiveShadow = vars.use_shadows;
        this.scene.add(this.desk); 

        this.renderer.render(this.scene, this.camera);
    }

    // @param diceToRoll (string), ex: "1d100+1d10+1d4+1d6+1d8+1d12+1d20"
    that.dice_box.prototype.setDice = function(diceToRoll) {
        this.diceToRoll = diceToRoll;
    }

    //call this to roll dice programatically or from click
    that.dice_box.prototype.start_throw = function(before_roll, after_roll) {
        var box = this;
        if (box.rolling) return;

        var vector = { x: (rnd() * 2 - 1) * box.w, y: -(rnd() * 2 - 1) * box.h };
        var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        var boost = (rnd() + 3) * dist;
        throw_dices(box, vector, boost, dist, before_roll, after_roll);
    }

    //call this to roll dice from swipe (will throw dice in direction swiped)
    that.dice_box.prototype.bind_swipe = function(container, before_roll, after_roll) {
        let box = this;
        $t.bind(container, ['mousedown', 'touchstart'], function(ev) {
            ev.preventDefault();
            box.mouse_time = (new Date()).getTime();
            box.mouse_start = $t.get_mouse_coords(ev);
        });
        $t.bind(container, ['mouseup', 'touchend'], function(ev) {
            if (box.rolling) return; 
            if (box.mouse_start == undefined) return;
            var m = $t.get_mouse_coords(ev);
            var vector = { x: m.x - box.mouse_start.x, y: -(m.y - box.mouse_start.y) };
            box.mouse_start = undefined;
            var dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
            if (dist < Math.sqrt(box.w * box.h * 0.01)) return;
            var time_int = (new Date()).getTime() - box.mouse_time;
            if (time_int > 2000) time_int = 2000;
            var boost = Math.sqrt((2500 - time_int) / 2500) * dist * 2;           
            throw_dices(box, vector, boost, dist, before_roll, after_roll);
        });
    }

    function throw_dices(box, vector, boost, dist, before_roll, after_roll) {
        var uat = vars.use_adapvite_timestep;

        vector.x /= dist; vector.y /= dist;
        var notation = that.parse_notation(box.diceToRoll);
        if (notation.set.length == 0) return;
        //TODO: how do large numbers of vectors affect performance?
        var vectors = box.generate_vectors(notation, vector, boost);
        box.rolling = true;
        let request_results = null;        

        let numDice = vectors.length;
        numDice = numDice > 10 ? 10 : numDice;
        for(let i = 0; i < numDice; i++) {
            let volume = i/10;
            if(volume <= 0) volume = 0.1;
            if(volume > 1) volume = 1;
            playSound(box.container, volume);
            //todo: find a better way to do this
        }

        if (before_roll) {
            request_results = before_roll(notation);
        }
        roll(request_results);

        //@param request_results (optional) - pass in an array of desired roll results
        //todo: when this param is used, animation isn't as smooth (uat not used?)
        function roll(request_results) {
            box.clear();
            box.roll(vectors, request_results || notation.result, function(result) {
                notation.result = result;
                var res = result.join(' ');
                if (notation.constant) {
                    if (notation.constant > 0) res += ' +' + notation.constant;
                    else res += ' -' + Math.abs(notation.constant);
                }                
                notation.resultTotal = (result.reduce(function(s, a) { return s + a; }) + notation.constant);
                if (result.length > 1 || notation.constant) {
                    res += ' = ' + notation.resultTotal;
                }
                notation.resultString = res;

                if (after_roll) after_roll(notation);

                box.rolling = false;
                vars.use_adapvite_timestep = uat;
            });
        }
    }
       
    //todo: the rest of these don't need to be public, but need to read the this properties
    that.dice_box.prototype.generate_vectors = function(notation, vector, boost) {
        var vectors = [];
        for (var i in notation.set) {
            var vec = make_random_vector(vector);
            var pos = {
                x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
                y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
                z: rnd() * 200 + 200
            };
            var projector = Math.abs(vec.x / vec.y);
            if (projector > 1.0) pos.y /= projector; else pos.x *= projector;
            var velvec = make_random_vector(vector);
            var velocity = { x: velvec.x * boost, y: velvec.y * boost, z: -10 };
            var inertia = CONSTS.dice_inertia[notation.set[i]];
            var angle = {
                x: -(rnd() * vec.y * 5 + inertia * vec.y),
                y: rnd() * vec.x * 5 + inertia * vec.x,
                z: 0
            };
            var axis = { x: rnd(), y: rnd(), z: rnd(), a: rnd() };
            vectors.push({ set: notation.set[i], pos: pos, velocity: velocity, angle: angle, axis: axis });
        }
        return vectors;
    }

    that.dice_box.prototype.create_dice = function(type, pos, velocity, angle, axis) {
        var dice = threeD_dice['create_' + type]();
        dice.castShadow = true;
        dice.dice_type = type;
        dice.body = new CANNON.RigidBody(CONSTS.dice_mass[type],
                dice.geometry.cannon_shape, this.dice_body_material);
        dice.body.position.set(pos.x, pos.y, pos.z);
        dice.body.quaternion.setFromAxisAngle(new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * Math.PI * 2);
        dice.body.angularVelocity.set(angle.x, angle.y, angle.z);
        dice.body.velocity.set(velocity.x, velocity.y, velocity.z);
        dice.body.linearDamping = 0.1;
        dice.body.angularDamping = 0.1;
        this.scene.add(dice);
        this.dices.push(dice);
        this.world.add(dice.body);
    }

    that.dice_box.prototype.check_if_throw_finished = function() {
        var res = true;
        var e = 6;
        if (this.iteration < 10 / vars.frame_rate) {
            for (var i = 0; i < this.dices.length; ++i) {
                var dice = this.dices[i];
                if (dice.dice_stopped === true) continue;
                var a = dice.body.angularVelocity, v = dice.body.velocity;
                if (Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e &&
                        Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
                    if (dice.dice_stopped) {
                        if (this.iteration - dice.dice_stopped > 3) {
                            dice.dice_stopped = true;
                            continue;
                        }
                    }
                    else dice.dice_stopped = this.iteration;
                    res = false;
                }
                else {
                    dice.dice_stopped = undefined;
                    res = false;
                }
            }
        }
        return res;
    }

    that.dice_box.prototype.emulate_throw = function() {
        while (!this.check_if_throw_finished()) {
            ++this.iteration;
            this.world.step(vars.frame_rate);
        }
        return get_dice_values(this.dices);
    }

    that.dice_box.prototype.__animate = function(threadid) {
        var time = (new Date()).getTime();
        var time_diff = (time - this.last_time) / 1000;
        if (time_diff > 3) time_diff = vars.frame_rate;
        ++this.iteration;
        if (vars.use_adapvite_timestep) {
            while (time_diff > vars.frame_rate * 1.1) {
                this.world.step(vars.frame_rate);
                time_diff -= vars.frame_rate;
            }
            this.world.step(time_diff);
        }
        else {
            this.world.step(vars.frame_rate);
        }
        for (var i in this.scene.children) {
            var interact = this.scene.children[i];
            if (interact.body != undefined) {
                interact.position.copy(interact.body.position);
                interact.quaternion.copy(interact.body.quaternion);
            }
        }
        this.renderer.render(this.scene, this.camera);
        this.last_time = this.last_time ? time : (new Date()).getTime();
        if (this.running == threadid && this.check_if_throw_finished()) {
            this.running = false;
            if (this.callback) this.callback.call(this, get_dice_values(this.dices));
        }
        if (this.running == threadid) {
            (function(t, tid, uat) {
                if (!uat && time_diff < vars.frame_rate) {
                    setTimeout(function() { requestAnimationFrame(function() { t.__animate(tid); }); },
                        (vars.frame_rate - time_diff) * 1000);
                }
                else requestAnimationFrame(function() { t.__animate(tid); });
            })(this, threadid, vars.use_adapvite_timestep);
        }
    }

    that.dice_box.prototype.clear = function() {
        this.running = false;
        var dice;
        while (dice = this.dices.pop()) {
            this.scene.remove(dice); 
            if (dice.body) this.world.remove(dice.body);
        }
        if (this.pane) this.scene.remove(this.pane);
        this.renderer.render(this.scene, this.camera);
        var box = this;
        setTimeout(function() { box.renderer.render(box.scene, box.camera); }, 100);
    }

    that.dice_box.prototype.prepare_dices_for_roll = function(vectors) {
        this.clear();
        this.iteration = 0;
        for (var i in vectors) {
            this.create_dice(vectors[i].set, vectors[i].pos, vectors[i].velocity,
                    vectors[i].angle, vectors[i].axis);
        }
    }

    that.dice_box.prototype.roll = function(vectors, values, callback) {
        this.prepare_dices_for_roll(vectors);
        if (values != undefined && values.length) {
            vars.use_adapvite_timestep = false;
            var res = this.emulate_throw();
            this.prepare_dices_for_roll(vectors);
            for (var i in res)
                shift_dice_faces(this.dices[i], values[i], res[i]);
        }
        this.callback = callback;
        this.running = (new Date()).getTime();
        this.last_time = 0;
        this.__animate(this.running);
    }

    that.dice_box.prototype.search_dice_by_mouse = function(ev) {
        var m = $t.get_mouse_coords(ev);
        var intersects = (new THREE.Raycaster(this.camera.position, 
                    (new THREE.Vector3((m.x - this.cw) / this.aspect,
                                       1 - (m.y - this.ch) / this.aspect, this.w / 9))
                    .sub(this.camera.position).normalize())).intersectObjects(this.dices);
        if (intersects.length) return intersects[0].object.userData;
    }


    // PUBLIC FUNCTIONS

    //validates dice notation input
    //notation should be in format "1d4+2d6"
    that.parse_notation = function(notation) {
        var no = notation.split('@');
        var dr0 = /\s*(\d*)([a-z]+)(\d+)(\s*(\+|\-)\s*(\d+)){0,1}\s*(\+|$)/gi;
        var dr1 = /(\b)*(\d+)(\b)*/gi;
        var ret = { 
            set: [], //set of dice to roll
            constant: 0, //modifier to add to result
            result: [], //array of results of each die
            resultTotal: 0, //dice results + constant
            resultString: '', //printable result
            error: false //input errors are ignored gracefully
        }; 
        var res;
        //looks at each peice of the notation and adds dice and constants to results
        while (res = dr0.exec(no[0])) {
            var command = res[2];
            if (command != 'd') { ret.error = true; continue; }
            var count = parseInt(res[1]);
            if (res[1] == '') count = 1;
            var type = 'd' + res[3];
            if (CONSTS.known_types.indexOf(type) == -1) { ret.error = true; continue; }
            while (count--) ret.set.push(type);
            if (res[5] && res[6]) {
                if (res[5] == '+') ret.constant += parseInt(res[6]);
                else ret.constant -= parseInt(res[6]);
            }
        }
        while (res = dr1.exec(no[1])) {
            ret.result.push(parseInt(res[2]));
        }
        return ret;
    }

    that.stringify_notation = function(nn) {
        var dict = {}, notation = '';
        for (var i in nn.set) 
            if (!dict[nn.set[i]]) dict[nn.set[i]] = 1; else ++dict[nn.set[i]];
        for (var i in dict) {
            if (notation.length) notation += ' + ';
            notation += (dict[i] > 1 ? dict[i] : '') + i;
        }
        if (nn.constant) {
            if (nn.constant > 0) notation += ' + ' + nn.constant;
            else notation += ' - ' + Math.abs(nn.constant);
        }
        return notation;
    }
    
    // PRIVATE FUNCTIONS

    // dice geometries
    let threeD_dice = {};

    threeD_dice.create_d4 = function() {
        if (!this.d4_geometry) this.d4_geometry = create_d4_geometry(vars.scale * 1.2);
        if (!this.d4_material) this.d4_material = new THREE.MeshFaceMaterial(
                create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[0]));
        return new THREE.Mesh(this.d4_geometry, this.d4_material);
    }

    threeD_dice.create_d6 = function() {
        if (!this.d6_geometry) this.d6_geometry = create_d6_geometry(vars.scale * 1.1);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 0.9));
        return new THREE.Mesh(this.d6_geometry, this.dice_material);
    }

    threeD_dice.create_d8 = function() {
        if (!this.d8_geometry) this.d8_geometry = create_d8_geometry(vars.scale);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 1.4));
        return new THREE.Mesh(this.d8_geometry, this.dice_material);
    }

    threeD_dice.create_d9 = function() {
        if (!this.d10_geometry) this.d10_geometry = create_d10_geometry(vars.scale * 0.9);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 1.0));
        return new THREE.Mesh(this.d10_geometry, this.dice_material);
    }

    threeD_dice.create_d10 = function() {
        if (!this.d10_geometry) this.d10_geometry = create_d10_geometry(vars.scale * 0.9);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 1.0));
        return new THREE.Mesh(this.d10_geometry, this.dice_material);
    }

    threeD_dice.create_d12 = function() {
        if (!this.d12_geometry) this.d12_geometry = create_d12_geometry(vars.scale * 0.9);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 1.0));
        return new THREE.Mesh(this.d12_geometry, this.dice_material);
    }

    threeD_dice.create_d20 = function() {
        if (!this.d20_geometry) this.d20_geometry = create_d20_geometry(vars.scale);
        if (!this.dice_material) this.dice_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d20_dice_face_labels, vars.scale / 2, 1.2));
        return new THREE.Mesh(this.d20_geometry, this.dice_material);
    }

    threeD_dice.create_d100 = function() {
        if (!this.d10_geometry) this.d10_geometry = create_d10_geometry(vars.scale * 0.9);
        if (!this.d100_material) this.d100_material = new THREE.MeshFaceMaterial(
                create_dice_materials(CONSTS.standart_d100_dice_face_labels, vars.scale / 2, 1.5));
        return new THREE.Mesh(this.d10_geometry, this.d100_material);
    }
    
    function create_dice_materials(face_labels, size, margin) {
        function create_text_texture(text, color, back_color) {
            if (text == undefined) return null;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + size * 2 * margin) * 2;
            canvas.width = canvas.height = ts;
            context.font = ts / (1 + 2 * margin) + "pt Arial";
            context.fillStyle = back_color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = color;
            context.fillText(text, canvas.width / 2, canvas.height / 2);
            if (text == '6' || text == '9') {
                context.fillText('  .', canvas.width / 2, canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < face_labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options,
                        { map: create_text_texture(face_labels[i], vars.label_color, vars.dice_color) })));
        return materials;
    }

    function create_d4_materials(size, margin, labels) {
        function create_d4_text(text, color, back_color) {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + margin) * 2;
            canvas.width = canvas.height = ts;
            context.font = (ts - margin) * 0.5 + "pt Arial";
            context.fillStyle = back_color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = color;
            for (var i in text) {
                context.fillText(text[i], canvas.width / 2,
                        canvas.height / 2 - ts * 0.3);
                context.translate(canvas.width / 2, canvas.height / 2);
                context.rotate(Math.PI * 2 / 3);
                context.translate(-canvas.width / 2, -canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial($t.copyto(vars.material_options,
                        { map: create_d4_text(labels[i], vars.label_color, vars.dice_color) })));
        return materials;
    }

    function create_d4_geometry(radius) {
        var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.96);
    }

    function create_d6_geometry(radius) {
        var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
                [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
    }

    function create_d8_geometry(radius) {
        var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
                [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
    }

    function create_d10_geometry(radius) {
        var a = Math.PI * 2 / 10, k = Math.cos(a), h = 0.105, v = -1;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a)
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        vertices.push([0, 0, -1]); vertices.push([0, 0, 1]);
        var faces = [[5, 7, 11, 0], [4, 2, 10, 1], [1, 3, 11, 2], [0, 8, 10, 3], [7, 9, 11, 4],
                [8, 6, 10, 5], [9, 1, 11, 6], [2, 0, 10, 7], [3, 5, 11, 8], [6, 4, 10, 9],
                [1, 0, 2, v], [1, 2, 3, v], [3, 2, 4, v], [3, 4, 5, v], [5, 4, 6, v],
                [5, 6, 7, v], [7, 6, 8, v], [7, 8, 9, v], [9, 8, 0, v], [9, 0, 1, v]];
        return create_geom(vertices, faces, radius, 0, Math.PI * 6 / 5, 0.945);
    }

    function create_d12_geometry(radius) {
        var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
                [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
                [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
                [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
                [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
                [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
    }

    function create_d20_geometry(radius) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0 ], [-1, -t, 0], [1, -t, 0],
                [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
                [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
                [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
                [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
                [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
    }

    // HELPERS

    function rnd() {
        return Math.random();
    }

    function create_shape(vertices, faces, radius) {
        var cv = new Array(vertices.length), cf = new Array(faces.length);
        for (var i = 0; i < vertices.length; ++i) {
            var v = vertices[i];
            cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
        }
        for (var i = 0; i < faces.length; ++i) {
            cf[i] = faces[i].slice(0, faces[i].length - 1);
        }
        return new CANNON.ConvexPolyhedron(cv, cf);
    }

    function make_geom(vertices, faces, radius, tab, af) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            var vertex = vertices[i].multiplyScalar(radius);
            vertex.index = geom.vertices.push(vertex) - 1;
        }
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                            geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
                geom.faceVertexUvs[0].push([
                        new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                        new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                            (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

    function chamfer_geom(vectors, faces, chamfer) {
        var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i = 0; i < faces.length; ++i) {
            var ii = faces[i], fl = ii.length - 1;
            var center_point = new THREE.Vector3();
            var face = new Array(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = chamfer_vectors[face[j]];
                vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (var i = 0; i < faces.length - 1; ++i) {
            for (var j = i + 1; j < faces.length; ++j) {
                var pairs = [], lastm = -1;
                for (var m = 0; m < faces[i].length - 1; ++m) {
                    var n = faces[j].indexOf(faces[i][m]);
                    if (n >= 0 && n < faces[j].length - 1) {
                        if (lastm >= 0 && m != lastm + 1) pairs.unshift([i, m], [j, n]);
                        else pairs.push([i, m], [j, n]);
                        lastm = m;
                    }
                }
                if (pairs.length != 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                        chamfer_faces[pairs[1][0]][pairs[1][1]],
                        chamfer_faces[pairs[3][0]][pairs[3][1]],
                        chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (var i = 0; i < corner_faces.length; ++i) {
            var cf = corner_faces[i], face = [cf[0]], count = cf.length - 1;
            while (count) {
                for (var m = faces.length; m < chamfer_faces.length; ++m) {
                    var index = chamfer_faces[m].indexOf(face[face.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index == -1) index = 3;
                        var next_vertex = chamfer_faces[m][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face.push(-1);
            chamfer_faces.push(face);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    function create_geom(vertices, faces, radius, tab, af, chamfer) {
        var vectors = new Array(vertices.length);
        for (var i = 0; i < vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
        }
        var cg = chamfer_geom(vectors, faces, chamfer);
        var geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
        //var geom = make_geom(vectors, faces, radius, tab, af); // Without chamfer
        geom.cannon_shape = create_shape(vectors, faces, radius);
        return geom;
    }

    function calc_texture_size(approx) {
        return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
    }

    function make_random_vector(vector) {
        var random_angle = rnd() * Math.PI / 5 - Math.PI / 5 / 2;
        var vec = {
            x: vector.x * Math.cos(random_angle) - vector.y * Math.sin(random_angle),
            y: vector.x * Math.sin(random_angle) + vector.y * Math.cos(random_angle)
        };
        if (vec.x == 0) vec.x = 0.01;
        if (vec.y == 0) vec.y = 0.01;
        return vec;
    }

    //determines which face is up after roll animation
    function get_dice_value(dice) {
        var vector = new THREE.Vector3(0, 0, dice.dice_type == 'd4' ? -1 : 1);
        var closest_face, closest_angle = Math.PI * 2;
        for (var i = 0, l = dice.geometry.faces.length; i < l; ++i) {
            var face = dice.geometry.faces[i];
            if (face.materialIndex == 0) continue;
            var angle = face.normal.clone().applyQuaternion(dice.body.quaternion).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = face;
            }
        }
        var matindex = closest_face ? closest_face.materialIndex - 1 : -1; //todo: bug thrown here, sometimes closest_face = undefined
        if (dice.dice_type == 'd100') matindex *= 10;
        if (dice.dice_type == 'd10' && matindex == 0) matindex = 10;
        return matindex;
    }

    function get_dice_values(dices) {
        var values = [];
        for (var i = 0, l = dices.length; i < l; ++i) {
            values.push(get_dice_value(dices[i]));
        }
        return values;
    }

    function shift_dice_faces(dice, value, res) {
        var r = CONSTS.dice_face_range[dice.dice_type];
        if (dice.dice_type == 'd10' && value == 10) value = 0;
        if (!(value >= r[0] && value <= r[1])) return;
        var num = value - res;
        var geom = dice.geometry.clone();
        for (var i = 0, l = geom.faces.length; i < l; ++i) {
            var matindex = geom.faces[i].materialIndex;
            if (matindex == 0) continue;
            matindex += num - 1;
            while (matindex > r[1]) matindex -= r[1];
            while (matindex < r[0]) matindex += r[1];
            geom.faces[i].materialIndex = matindex + 1;
        }
        if (dice.dice_type == 'd4' && num != 0) {
            if (num < 0) num += 4;
            dice.material = new THREE.MeshFaceMaterial(
                    create_d4_materials(vars.scale / 2, vars.scale * 2, CONSTS.d4_labels[num]));
        }
        dice.geometry = geom;
    }
    
    //playSound function and audio file copied from 
    //https://github.com/chukwumaijem/roll-a-die
    function playSound(outerContainer, soundVolume) {
        if (soundVolume === 0) return;
        const audio = document.createElement('audio');
        outerContainer.appendChild(audio);
        audio.src = 'data:audio/mpeg;base64,SUQzAwAAAAAfdlRQRTEAAAAVAAAB//41ADIAMwA0ADYAKABuAGMAKQBURU5DAAAANwAAAf/+UwBPAE4AWQAgAEkAQwAgAFIARQBDAE8AUgBEAEUAUgAgAE0AUAAzACAAMwAuADEALgAzAFRJVDIAAAAPAAAB//4xAGQANgAoADIAKQBHRU9CAAAK0QAAAAAAU2ZNYXJrZXJzAAwAAABkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7sAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEluZm8AAAAPAAAAKAAAZGcABgYMDBMTExkZICAgJiYsLCwzMzk5OUBARkZGTExTU1NZWWBgYGZmbGxsc3N5eXmAgIaGhoyMk5OTmZmgoKCmpqysrLOzubm5wMDGxsbMzNPT09nZ4ODg5ubs7Ozz8/n5+f//AAAAOUxBTUUzLjk4cgG6AAAAACwCAAA0wCQGuEUAAMAAAGRnTs5LfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uwBAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuOTguMlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy45OC4yVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+7IE34/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTguMlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+7IE3w/wAABpAAAACAAADSAAAAEAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuOTguMlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+7IE3w/wAABpAAAACAAADSAAAAEAAAGkFAAAIAAANIKAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVAIEAYCAgFAwDAIAAAA8DSKgAluzAfuSB0vHgeiUDjPgBHAQhfwNGFFAhaP/icwaEAJNAMeD/8DOpQAXAHgWAIUAbgR/+GJyLh6YdOLhE///5FCAEVGTIiLLS///I4dopcg5NkTFULLMP///I8coR4MgQ8rkTUw8jj/////MCYJxMW4aAzZAyLDIE+JsDpCaGY/////////2TSNCQL6ABAgDAQEAoGAYBAAAAHgaRUAEt2YD9yQOl48D0SgcZ8AI4CEL+BowooELR/8TmDQgBJoBjwf/gZ1KAC4A8CwBCgDcCP/wxORcPTDpxcIn///IoQAioyZERZaX//5HDtFLkHJsiYqhZZh///5HjlCPBkCHlciamHkcf////5gTBOJi3DQGbIGRYZAnxNgdITQzH////////+yaRoSBfQFotFotFotFotFotFot/gKy1/5jQCtOr8WwkgGsDlwkYwYSID258kCUC9BUQ/+xfJdxRSC9E74wgwhosvjkBbQnJcHl+7oMmXxhicZorf+5um6GPas4Ysd/6kGamhk43MCRHqPUf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UAo7yWVv/p5fK//7TnOAQUS2TjiRLZ9UaCgEiRIkSOfzP9HEjpY9EJ0Gga/EQd/xEFAaFuFdE+FlGUMsWQW8Yg6RNhgkCKsmBIyeF3DUahSKhNGgVjgOZXSJUyVCTnhGEYEQ6FImCsOBzEAEPKNOLMPQRJGlFmHmW7Ozs7OacacaUeQTCiIMJAgMQDkIvzTteZTs7OxpEGBRQkCFghNPP//lEiIoSBAYgWYUWcaUWYegikaUWUfFuzs7O0ycaUWUfCaUlaQMh//4MSqiJgaqoMVFuP/7sATcjMRkVceR6TOwjIq48j0mdhPJWoIHsM8KeStQQPYZ4VdE+FlGUMsWQW8Yg6RNhgkCKsmBIyeF3DUahSKhNGgVjgOZXSJUyVCTnhGEYEQ6FImCsOBzEAEPKNOLMPQRJGlFmHmW7Ozs7OacacaUeQTCiIMJAgMQDkIvzTteZTs7OxpEGBRQkCFghNPP//lEiIoSBAYgWYUWcaUWYegikaUWUfFuzs7O0ycaUWUfCaUlaQMh//4MSqiJgaqoMVVMQU1FMy45OC4yVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBNiP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBN8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBN8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBN8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBN8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uyBN8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk4LjJVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVEFHMWQ2KDIpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANTIzNDYobmMpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8='; // embedded from dice-main/assets/nc93322.mp3
        audio.volume = soundVolume;
        const playPromise = audio.play(); if (playPromise && playPromise.catch) playPromise.catch(()=>{});
        audio.onended = () => {
          audio.remove();
        };
    }

    return that;
}());


