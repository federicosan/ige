/**
 * Creates a new camera that will be attached to a viewport.
 */
var IgeCamera = IgeEntity.extend({
	classId: 'IgeCamera',

	init: function (entity) {
		this._super();

		this._trackRotateTarget = undefined;
		this._trackTranslateTarget = undefined;
		this._trackRotateSmoothing = undefined;
		this._trackTranslateSmoothing = undefined;

		// Store the viewport this camera is attached to
		this._entity = entity;
	},

	/**
	 * Gets / sets the rectangle that the camera translate
	 * will be limited to using an IgeRect instance.
	 * @param {IgeRect=} rect
	 * @return {*}
	 */
	limit: function (rect) {
		// TODO: Write the usage of this limit data, currently does nothing
		if (rect !== undefined) {
			this._limit = rect;
			return this._entity;
		}

		return this._limit;
	},

	/**
	 * Pan (tween) the camera to the new specified point in
	 * the specified time.
	 * @param {IgePoint} point The point describing the co-ordinates to pan to.
	 * @param {Number} durationMs The number of milliseconds to span the pan operation over.
	 * @param {String=} easing Optional easing method name.
	 */
	panTo: function (point, durationMs, easing) {
		if (point !== undefined) {
			this._translate.tween()
				.properties({
					x: point.x,
					y: point.y,
					z: point.z
				})
				.duration(durationMs)
				.easing(easing)
				.start();
		}

		return this._entity;
	},

	/**
	 * Pan (tween) the camera by the new specified point in
	 * the specified time.
	 * @param {IgePoint} point The point describing the co-ordinates to pan by.
	 * @param {Number} durationMs The number of milliseconds to span the pan operation over.
	 * @param {String=} easing Optional easing method name.
	 */
	panBy: function (point, durationMs, easing) {
		if (point !== undefined) {
			this._translate.tween()
				.properties({
					x: point.x + this._translate.x,
					y: point.y + this._translate.y,
					z: point.z + this._translate.z
				})
				.duration(durationMs)
				.easing(easing)
				.start();
		}

		return this._entity;
	},

	/**
	 * Tells the camera to track the movement of the specified
	 * target entity. The camera will center on the entity.
	 * @param {IgeEntity} entity
	 * @param {Number=} smoothing Determines how quickly the camera
	 * will track the target, the higher the number, the slower the
	 * tracking will be.
	 * @param {Boolean=} rounding Sets if the smoothing system is
	 * allowed to use floating point values or not. If enabled then
	 * it will not use floating point values.
	 * @return {*}
	 */
	trackTranslate: function (entity, smoothing, rounding) {
		if (entity !== undefined) {
			this.log('Camera on viewport ' + this._entity.id() + ' is now tracking translation target ' + entity.id());
			this._trackTranslateRounding = rounding;
			this._trackTranslateSmoothing = smoothing >= 1  ? smoothing : 0;
			this._trackTranslateTarget = entity;
			return this._entity;
		}

		return this._trackTranslateTarget;
	},

	/**
	 * Gets / sets the translate tracking smoothing value.
	 * @param {Number=} val
	 * @return {*}
	 */
	trackTranslateSmoothing: function (val) {
		if (val !== undefined) {
			this._trackTranslateSmoothing = val;
			return this;
		}

		return this._trackTranslateSmoothing;
	},

	/**
	 * Gets / sets the translate tracking smoothing rounding
	 * either enabled or disabled. When enabled the translate
	 * smoothing value will be rounded so that floating point
	 * values are not used which can help when smoothing on a
	 * scene that has texture smoothing disabled so sub-pixel
	 * rendering doesn't work and objects appear to "snap"
	 * into position as the smoothing interpolates.
	 * @param {Boolean=} val
	 * @return {*}
	 */
	trackTranslateRounding: function (val) {
		if (val !== undefined) {
			this._trackTranslateRounding = val;
			return this;
		}

		return this._trackTranslateRounding;
	},

	/**
	 * Stops tracking the current tracking target's translation.
	 */
	unTrackTranslate: function () {
		delete this._trackTranslateTarget;
	},

	/**
	 * Tells the camera to track the rotation of the specified
	 * target entity.
	 * @param {IgeEntity} entity
	 * @param {Number=} smoothing Determines how quickly the camera
	 * will track the target, the higher the number, the slower the
	 * tracking will be.
	 * @return {*}
	 */
	trackRotate: function (entity, smoothing) {
		if (entity !== undefined) {
			this.log('Camera on viewport ' + this._entity.id() + ' is now tracking rotation of target ' + entity.id());
			this._trackRotateSmoothing = smoothing >= 1 ? smoothing : 0;
			this._trackRotateTarget = entity;
			return this._entity;
		}

		return this._trackRotateTarget;
	},

	/**
	 * Gets / sets the rotate tracking smoothing value.
	 * @param {Number=} val
	 * @return {*}
	 */
	trackRotateSmoothing: function (val) {
		if (val !== undefined) {
			this._trackRotateSmoothing = val;
			return this;
		}

		return this._trackRotateSmoothing;
	},

	/**
	 * Stops tracking the current tracking target.
	 */
	unTrackRotate: function () {
		delete this._trackRotateTarget;
	},

	/**
	 * Translates the camera to the center of the specified entity so
	 * that the camera is "looking at" the entity.
	 * @param entity
	 * @return {*}
	 */
	lookAt: function (entity) {
		if (entity !== undefined) {
			entity.updateTransform();

			// Copy the target's world matrix translate data
			this._translate.x = Math.floor(entity._worldMatrix.matrix[2]);
			this._translate.y = Math.floor(entity._worldMatrix.matrix[5]);

			this.updateTransform();
		}

		return this;
	},

	/**
	 * Process operations during the engine tick.
	 * @param ctx
	 */
	tick: function (ctx) {
		// Check if we are tracking the translate value of a target
		if (this._trackTranslateTarget) {
			var targetEntity = this._trackTranslateTarget,
				targetMatrix = targetEntity._worldMatrix.matrix,
				targetX = targetMatrix[2],
				targetY = targetMatrix[5],
				sourceX, sourceY, distX, distY;

			if (!this._trackTranslateSmoothing) {
				// Copy the target's world matrix translate data
				this.lookAt(this._trackTranslateTarget);
			} else {
				// Ease between the current and target values
				sourceX = this._translate.x;
				sourceY = this._translate.y;

				distX = Math.round(targetX - sourceX);
				distY = Math.round(targetY - sourceY);

				if (this._trackTranslateRounding) {
					this._translate.x += Math.round(distX / this._trackTranslateSmoothing);
					this._translate.y += Math.round(distY / this._trackTranslateSmoothing);
				} else {
					this._translate.x += distX / this._trackTranslateSmoothing;
					this._translate.y += distY / this._trackTranslateSmoothing;
				}
			}
		}

		// Check if we are tracking the rotation values of a target
		if (this._trackRotateTarget) {
			var targetParentRZ = this._trackRotateTarget._parent !== undefined ? this._trackRotateTarget._parent._rotate.z : 0,
				targetZ = -(targetParentRZ + this._trackRotateTarget._rotate.z),
				sourceZ, distZ;

			if (!this._trackRotateSmoothing) {
				// Copy the target's rotate data
				this._rotate.z = targetZ;
			} else {
				// Interpolate between the current and target values
				sourceZ = this._rotate.z;
				distZ = targetZ - sourceZ;

				this._rotate.z += distZ / this._trackRotateSmoothing;
			}
		}

		// Updated local transform matrix and then transform the context
		this.updateTransform();
		this._localMatrix.transformRenderingContext(ctx);
	},

	/**
	 * Checks the current transform values against the previous ones. If
	 * any value is different, the appropriate method is called which will
	 * update the transformation matrix accordingly. This version of the
	 * method is specifically designed for cameras!
	 */
	updateTransform: function () {
		this._localMatrix.identity();

		// On cameras we do the rotation and scaling FIRST
		this._localMatrix.multiply(this._localMatrix._newRotate(this._rotate.z));
		this._localMatrix.multiply(this._localMatrix._newScale(this._scale.x, this._scale.y));

		if (this._mode === 0) {
			// 2d translation
			this._localMatrix.multiply(this._localMatrix._newTranslate(-this._translate.x, -this._translate.y));
		}

		if (this._mode === 1) {
			// iso translation
			var isoPoint = this._translateIso = new IgePoint(
				this._translate.x,
				this._translate.y,
				this._translate.z + this.geometry.z / 2
			).toIso();

			if (this._parent && this._parent.geometry.z) {
				// This adjusts the child entity so that 0, 0, 0 inside the
				// parent is the center of the base of the parent
				isoPoint.y += this._parent.geometry.z / 1.6;
			}

			this._localMatrix.multiply(this._localMatrix._newTranslate(isoPoint.x, isoPoint.y));
		}

		if (this._parent) {
			this._worldMatrix.copy(this._parent._worldMatrix);
			this._worldMatrix.multiply(this._localMatrix);
		} else {
			this._worldMatrix.copy(this._localMatrix);
		}
	},

	/**
	 * Returns a string containing a code fragment that when
	 * evaluated will reproduce this object's properties via
	 * chained commands. This method will only check for
	 * properties that are directly related to this class.
	 * Other properties are handled by their own class method.
	 * @private
	 * @return {String}
	 */
	_stringify: function () {
		// Get the properties for all the super-classes
		var str = this._super(), i;

		// Loop properties and add property assignment code to string
		for (i in this) {
			if (this.hasOwnProperty(i) && this[i] !== undefined) {
				switch (i) {
					case '_trackTranslateTarget':
						str += ".trackTranslate(ige.$('" + this._trackTranslateTarget.id() + "'), " + this.trackTranslateSmoothing() + ")";
						break;
					case '_trackRotateTarget':
						str += ".trackRotate(ige.$('" + this._trackRotateTarget.id() + "'), " + this.trackRotateSmoothing() + ")";
						break;
				}
			}
		}

		return str;
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = IgeCamera; }