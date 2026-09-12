#include "AbstractButton.h"

AbstractButton::AbstractButton() {}
AbstractButton::AbstractButton(string name) : Component(name,0,0,0,0) 
{
	command_ = 0;
}

bool AbstractButton::includes(MPoint p)
{
	if (p.x_ >= posx && p.x_ < posx + BOX_WIDTH && p.y_ <= posy)
	{
		return true;
	}
	return false;
}

void AbstractButton::addActionListener(ActionListener* listener)
{
	listener_ = listener;
}

void AbstractButton::setCommand(int command)
{
	command_ = command;
}

int AbstractButton::getCommand()
{
	return command_;
}

void AbstractButton::repaint(HDC dc)
{
	Rectangle(dc, posx, 0, posx + 100, posy);
	TextOutA(dc, posx + 30, 30, name_.c_str(), strlen(name_.c_str()));
}

