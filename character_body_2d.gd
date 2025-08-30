extends CharacterBody2D
# Get reference to AnimatedSprite2D node
@onready var animated_sprite: AnimatedSprite2D = $AnimatedSprite2D


const SPEED = 300.0
const JUMP_VELOCITY = -400.0



func _physics_process(_delta: float) -> void:
	# Top-down movement: get both horizontal and vertical input
	var input_vector = Vector2(
		Input.get_axis("ui_left", "ui_right"),
		Input.get_axis("ui_up", "ui_down")
	)
	if input_vector.length() > 0:
		input_vector = input_vector.normalized()
		velocity = input_vector * SPEED
		if not animated_sprite.is_playing():
			animated_sprite.play()
	else:
		velocity = velocity.move_toward(Vector2.ZERO, SPEED)
		animated_sprite.stop()
	move_and_slide()
