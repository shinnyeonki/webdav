#include "Button.h"
#include "frame.h"
#include "ActionListener.h"

Button::Button() {}
Button::Button(string name) : AbstractButton(name) {}

bool Button::eventHandler(ActionEvent e)
{
	//onclick();
	if (includes(e.getPoint()))
	{
		e.setEventBtnType(this);
		listener_->actionPerformed(e);
		return true;
	}
	return false;
}