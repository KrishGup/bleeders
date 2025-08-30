extends Button



# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	# Connect the button's pressed signal to the handler (Godot 4.x style)
	self.pressed.connect(_on_Button_pressed)

# Function to handle button press and start the game
func _on_Button_pressed() -> void:
	get_tree().change_scene_to_file("res://startScene.tscn")


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(_delta: float) -> void:
	pass
