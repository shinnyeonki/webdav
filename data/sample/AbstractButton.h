#pragma once
#include "Component.h"
//버튼들의 추상클래스
class ActionListener;
class AbstractButton : public Component
{
public:
	AbstractButton();
	AbstractButton(string);
	virtual void addActionListener(ActionListener *listner);
	void repaint(HDC) override;
	bool includes(MPoint p) override;
	void setCommand(int);
	int getCommand();

protected:
	ActionListener* listener_;
	int command_;
};

